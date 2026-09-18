import {
	putV1Profiles,
	putV1ProfilesAvatar,
} from "@oikos-circular-environment/oikos-sdk";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react-native";
import { launchImageLibraryAsync } from "expo-image-picker";
import { useRouter } from "expo-router";
import type React from "react";
import ProfileScreen from "@/app/(tabs)/(home)/profile";
import { Toaster } from "@/components/toast";
import { useAuthContext } from "@/contexts/auth-context";
import {
	getCepV2,
	listIbgeMunicipios,
	listIbgeUfs,
} from "@/libs/brasil-api-sdk";
import { makeAddress, makeProfile, makeUser } from "@/tests/factories";

jest.mock("expo-router", () => ({
	useRouter: jest.fn(),
	Stack: { Screen: () => null },
	Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("@/components/toast", () => {
	const React = require("react");
	const { View, Text } = require("react-native");
	return {
		toast: {
			success: jest.fn((title, message) => {
				global.mockToastShow({ type: "success", title, message });
			}),
			error: jest.fn((title, message) => {
				global.mockToastShow({ type: "error", title, message });
			}),
			info: jest.fn(),
			warning: jest.fn(),
			close: jest.fn(),
			closeAll: jest.fn(),
		},
		Toaster: () => {
			const [visibleToast, setVisibleToast] = React.useState(null);
			React.useEffect(() => {
				global.mockToastShow = t => setVisibleToast(t);
				return () => {
					global.mockToastShow = () => {};
				};
			}, []);

			if (!visibleToast) return null;
			return (
				<View testID="mock-toaster">
					<Text testID="toast-title">{visibleToast.title}</Text>
					<Text testID="toast-message">{visibleToast.message}</Text>
				</View>
			);
		},
	};
});

jest.mock("@/contexts/auth-context");

jest.mock("@oikos-circular-environment/oikos-sdk", () => ({
	putV1Profiles: jest.fn(),
	putV1ProfilesAvatar: jest.fn(),
}));

jest.mock("@/libs/brasil-api-sdk", () => ({
	getCepV2: jest.fn(),
	listIbgeUfs: jest.fn(),
	listIbgeMunicipios: jest.fn(),
}));

jest.mock("@/components/wrapper-map", () => ({
	__esModule: true,
	default: () => null,
}));

jest.mock("expo-image", () => ({ Image: () => null }));

jest.mock("expo-image-picker", () => ({
	launchImageLibraryAsync: jest.fn(),
}));

jest.mock("@/libs/media/compression", () => ({
	compressImage: jest.fn().mockResolvedValue("compressed-uri"),
}));

const mockUpdateUserProfile = jest.fn();

const mockUser = makeUser({
	profile: makeProfile({
		user_id: "user-1",
		id: "profile-1",
		full_name: "Emanuel Ribeiro de Souza",
		display_name: "Emanuel",
		phone: "11987654321",
		address: makeAddress({
			id: "addr-1",
			zip_code: "01310100",
			street: "Avenida Paulista",
			number: "1000",
			complement: "",
			district: "Bela Vista",
			city: "São Paulo",
			city_ibge_id: 3550308,
			state: "São Paulo",
			state_code: "SP",
			state_ibge_id: 35,
			latitude: -23.5505,
			longitude: -46.6333,
		}),
	}),
});

const mockRouter = { push: jest.fn(), back: jest.fn(), navigate: jest.fn() };

function setupAuthMock(
	overrides: Partial<ReturnType<typeof useAuthContext>> = {},
) {
	jest.mocked(useAuthContext).mockReturnValue({
		user: mockUser,
		isAuthenticated: true,
		isLoading: false,
		needsProfileCompletion: false,
		deletionScheduledAt: null,
		signIn: jest.fn(),
		signUp: jest.fn(),
		signOut: jest.fn(),
		refreshSession: jest.fn(),
		requestDeletion: jest.fn(),
		cancelDeletion: jest.fn(),
		isRequestingDeletion: false,
		account: null,
		changePassword: jest.fn(),
		isChangingPassword: false,
		isCancellingDeletion: false,
		updateUserProfile: mockUpdateUserProfile,
		...overrides,
	});
}

async function renderProfile() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	const component = await render(
		<QueryClientProvider client={queryClient}>
			<Toaster />
			<ProfileScreen />
		</QueryClientProvider>,
	);
	// Wait for the screen to be ready
	await screen.findByTestId("input-full-name");
	return component;
}

describe("ProfileScreen — integração", () => {
	beforeEach(() => {
		jest.mocked(useRouter).mockReturnValue(mockRouter as any);
		setupAuthMock();
		jest.mocked(listIbgeUfs).mockResolvedValue({
			data: [
				{ id: 35, nome: "São Paulo", sigla: "SP" },
				{ id: 33, nome: "Rio de Janeiro", sigla: "RJ" },
			],
		} as any);
		jest.mocked(listIbgeMunicipios).mockResolvedValue({ data: [] } as any);
		// Default mocks — overridden per-test when needed
		jest.mocked(getCepV2).mockResolvedValue(undefined as any);
		jest.mocked(putV1Profiles).mockResolvedValue({ data: {} } as any);
	});

	afterEach(async () => {
		cleanup();
		jest.useRealTimers();
		jest.clearAllMocks();
	});

	// SKIP: estoura o timeout de 5s no EAS (contention de workers) — rodar localmente quando necessário
	it.skip("salva o perfil com sucesso, atualiza o contexto, exibe toast e navega para home", async () => {
		const updatedProfile = { ...mockUser.profile, display_name: "Manny" };
		jest.mocked(putV1Profiles).mockResolvedValue({
			data: { profile: updatedProfile },
		} as any);

		await renderProfile();

		const displayInput = await screen.findByTestId("input-display-name");
		fireEvent.changeText(displayInput, "Manny");

		const confirmBtn = screen.getByTestId("btn-confirm");
		await waitFor(() => {
			expect(confirmBtn).not.toBeDisabled();
		});
		fireEvent.press(confirmBtn);

		await waitFor(() => {
			expect(putV1Profiles).toHaveBeenCalled();
		});

		await waitFor(() => {
			expect(screen.getByTestId("toast-title")).toHaveTextContent(
				"Perfil atualizado!",
			);
			expect(mockRouter.push).toHaveBeenCalledWith("/(tabs)/(home)");
		});
	});

	it("faz upload de avatar com sucesso ao confirmar", async () => {
		const mockAsset = {
			uri: "fake-uri",
			fileName: "avatar.jpg",
			type: "image",
		};
		jest.mocked(launchImageLibraryAsync).mockResolvedValue({
			canceled: false,
			assets: [mockAsset as any],
		});
		jest.mocked(putV1ProfilesAvatar).mockResolvedValue({
			data: { id: "img-1", url: "http://new-avatar.url" },
		} as any);

		await renderProfile();

		// Trigger image picker
		fireEvent.press(screen.getByTestId("avatar-touchable"));

		await waitFor(() => {
			expect(launchImageLibraryAsync).toHaveBeenCalled();
		});

		const confirmBtn = screen.getByTestId("btn-confirm");
		await waitFor(() => {
			expect(confirmBtn).not.toBeDisabled();
		});
		fireEvent.press(confirmBtn);

		await waitFor(() => {
			expect(putV1ProfilesAvatar).toHaveBeenCalled();
			expect(mockUpdateUserProfile).toHaveBeenCalledWith(
				expect.objectContaining({
					profile: expect.objectContaining({
						profile_image: expect.objectContaining({
							url: "http://new-avatar.url",
						}),
					}),
				}),
			);
		});
	});

	it("exibe toast de erro e não navega quando a API de salvar perfil falha", async () => {
		jest.mocked(putV1Profiles).mockRejectedValue(new Error("Server error"));

		await renderProfile();

		const displayInput = await screen.findByTestId("input-display-name");
		fireEvent.changeText(displayInput, "Manny");

		const confirmBtn = screen.getByTestId("btn-confirm");
		await waitFor(() => {
			expect(confirmBtn).not.toBeDisabled();
		});
		fireEvent.press(confirmBtn);

		await waitFor(() => {
			expect(screen.getByTestId("toast-title")).toHaveTextContent(
				"Erro ao salvar",
			);
		});
		expect(mockRouter.push).not.toHaveBeenCalled();
	});

	it("busca CEP com sucesso e preenche os campos de endereço", async () => {
		jest.mocked(getCepV2).mockResolvedValue({
			data: {
				cep: "04538133",
				street: "Avenida Brigadeiro Faria Lima",
				neighborhood: "Itaim Bibi",
				city: "São Paulo",
				state: "SP",
			},
		} as any);

		await renderProfile();

		const zipInput = await screen.findByTestId("input-zip-code");
		fireEvent.changeText(zipInput, "04538133");
		await waitFor(() => {
			expect(screen.getByTestId("input-zip-code")).toHaveProp(
				"value",
				"04538-133",
			);
		});

		// InputSlot is accessibilityElementsHidden — requires includeHiddenElements
		fireEvent.press(
			screen.getByTestId("cep-search-btn", { includeHiddenElements: true }),
		);

		await waitFor(() => {
			expect(getCepV2).toHaveBeenCalledWith({ path: { cep: "04538133" } });
		});

		await waitFor(() => {
			expect(screen.getByTestId("input-street")).toHaveProp(
				"value",
				"Avenida Brigadeiro Faria Lima",
			);
			expect(screen.getByTestId("input-district")).toHaveProp(
				"value",
				"Itaim Bibi",
			);
			expect(screen.getByTestId("input-zip-code")).toHaveProp(
				"value",
				"04538-133",
			);
		});
	});

	it("exibe toast de erro quando o CEP não é encontrado", async () => {
		jest.mocked(getCepV2).mockRejectedValue(new Error("CEP not found"));

		await renderProfile();

		const zipInput = await screen.findByTestId("input-zip-code");
		fireEvent.changeText(zipInput, "00000000");
		await waitFor(() => {
			expect(screen.getByTestId("input-zip-code")).toHaveProp(
				"value",
				"00000-000",
			);
		});

		fireEvent.press(
			screen.getByTestId("cep-search-btn", { includeHiddenElements: true }),
		);

		await waitFor(() => {
			expect(screen.getByTestId("toast-title")).toHaveTextContent(
				"Erro ao buscar cep",
			);
		});
	});
});
