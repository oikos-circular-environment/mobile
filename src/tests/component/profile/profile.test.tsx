import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	render,
	screen,
	userEvent,
	waitFor,
} from "@testing-library/react-native";
import { launchImageLibraryAsync } from "expo-image-picker";
import { useRouter } from "expo-router";
import type React from "react";
import ProfileScreen from "@/app/(tabs)/(home)/profile";
import { Toaster } from "@/components/toast";
import { useAuthContext } from "@/contexts/auth-context";
import { listIbgeMunicipios, listIbgeUfs } from "@/libs/brasil-api-sdk";
import { putV1Profiles, putV1ProfilesAvatar } from "@/libs/oikos-sdk";
import { makeAddress, makeProfile, makeUser } from "@/tests/factories";

jest.mock("expo-router", () => ({
	useRouter: jest.fn(),
	Stack: { Screen: () => null },
	Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("@/contexts/auth-context");

jest.mock("@/libs/oikos-sdk", () => ({
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

jest.mock("@/libs/media-compression", () => ({
	compressImage: jest.fn().mockResolvedValue("compressed-uri"),
}));

jest.mock("@/components/toast", () => ({
	toast: {
		success: jest.fn(),
		error: jest.fn(),
		info: jest.fn(),
		warning: jest.fn(),
		close: jest.fn(),
		closeAll: jest.fn(),
	},
	Toaster: () => null,
}));

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
		user: null,
		isAuthenticated: false,
		isLoading: false,
		needsProfileCompletion: false,
		deletionScheduledAt: null,
		signIn: jest.fn(),
		signUp: jest.fn(),
		signOut: jest.fn(),
		requestDeletion: jest.fn(),
		cancelDeletion: jest.fn(),
		isRequestingDeletion: false,
		isCancellingDeletion: false,
		updateUserProfile: jest.fn(),
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

describe("ProfileScreen", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest
			.mocked(useRouter)
			.mockReturnValue(mockRouter as unknown as ReturnType<typeof useRouter>);
		jest.mocked(listIbgeUfs).mockResolvedValue({
			data: [
				{ id: 35, nome: "São Paulo", sigla: "SP" },
				{ id: 33, nome: "Rio de Janeiro", sigla: "RJ" },
			],
		} as unknown as Awaited<ReturnType<typeof listIbgeUfs>>);
		jest.mocked(listIbgeMunicipios).mockResolvedValue({
			data: [],
		} as unknown as Awaited<ReturnType<typeof listIbgeMunicipios>>);
		jest.mocked(putV1Profiles).mockResolvedValue({
			data: {},
		} as unknown as Awaited<ReturnType<typeof putV1Profiles>>);
	});

	afterEach(() => {
		jest.useRealTimers();
		jest.resetAllMocks();
	});

	it("renderiza campos preenchidos com os dados do usuário", async () => {
		setupAuthMock({ user: mockUser });
		await renderProfile();

		// phone '11987654321' → '(11) 9 8765-4321' | zip_code '01310100' → '01310-100'
		expect(screen.getByTestId("input-full-name")).toHaveProp(
			"value",
			"Emanuel Ribeiro de Souza",
		);
		expect(screen.getByTestId("input-display-name")).toHaveProp(
			"value",
			"Emanuel",
		);
		expect(screen.getByTestId("input-phone")).toHaveProp(
			"value",
			"(11) 9 8765-4321",
		);
		expect(screen.getByTestId("input-zip-code")).toHaveProp(
			"value",
			"01310-100",
		);
		expect(screen.getByTestId("input-street")).toHaveProp(
			"value",
			"Avenida Paulista",
		);
		expect(screen.getByTestId("input-number")).toHaveProp("value", "1000");
		expect(screen.getByTestId("input-district")).toHaveProp(
			"value",
			"Bela Vista",
		);
	});

	it("renderiza campos de endereço vazios quando usuário não possui endereço", async () => {
		setupAuthMock({
			user: { profile: { ...mockUser.profile, address: null } },
		});
		await renderProfile();

		expect(screen.getByTestId("input-full-name")).toHaveProp(
			"value",
			"Emanuel Ribeiro de Souza",
		);
		expect(screen.getByTestId("input-zip-code")).toHaveProp("value", "");
		expect(screen.getByTestId("input-street")).toHaveProp("value", "");
		expect(screen.getByTestId("input-district")).toHaveProp("value", "");
	});

	it("botão Confirmar desabilitado quando o formulário não foi modificado", async () => {
		setupAuthMock({ user: mockUser });
		await renderProfile();

		expect(screen.getByTestId("btn-confirm")).toBeDisabled();
	});

	it("botão Cancelar desabilitado quando o formulário não foi modificado", async () => {
		setupAuthMock({ user: mockUser });
		await renderProfile();

		expect(screen.getByTestId("btn-cancel")).toBeDisabled();
	});

	it("botão Confirmar habilitado após modificar um campo", async () => {
		const user = userEvent.setup();
		setupAuthMock({ user: mockUser });
		await renderProfile();

		const nameInput = screen.getByTestId("input-full-name");
		await user.clear(nameInput);
		await user.type(nameInput, "Novo Nome Completo Aqui");

		expect(screen.getByTestId("btn-confirm")).not.toBeDisabled();
	});

	it("exibe erro de validação para nome completo muito curto", async () => {
		const user = userEvent.setup();
		setupAuthMock({ user: mockUser });
		jest.mocked(putV1Profiles).mockResolvedValue({
			data: {},
		} as unknown as Awaited<ReturnType<typeof putV1Profiles>>);
		await renderProfile();

		const nameInput = screen.getByTestId("input-full-name");
		await user.clear(nameInput);
		await user.type(nameInput, "Ab");
		await user.press(screen.getByTestId("btn-confirm"));

		expect(
			await screen.findByText("Informe seu nome completo."),
		).toBeOnTheScreen();
	});

	it("exibe erro de validação para telefone em formato inválido", async () => {
		const user = userEvent.setup();
		setupAuthMock({ user: mockUser });
		await renderProfile();

		const phoneInput = screen.getByTestId("input-phone");
		await user.clear(phoneInput);
		// '123' → mask → '(12) 3' — não corresponde ao regex de telefone
		await user.type(phoneInput, "123");
		await user.press(screen.getByTestId("btn-confirm"));

		expect(
			await screen.findByText("Informe um celular valido."),
		).toBeOnTheScreen();
	});

	it("botão Cancelar restaura os valores originais e fica desabilitado novamente", async () => {
		const user = userEvent.setup();
		setupAuthMock({ user: mockUser });
		await renderProfile();

		const nameInput = screen.getByTestId("input-full-name");
		await user.clear(nameInput);
		await user.type(nameInput, "Nome Modificado");

		expect(screen.getByTestId("btn-cancel")).not.toBeDisabled();

		await user.press(screen.getByTestId("btn-cancel"));

		await waitFor(() => {
			expect(screen.getByTestId("input-full-name")).toHaveProp(
				"value",
				"Emanuel Ribeiro de Souza",
			);
		});
		expect(screen.getByTestId("btn-cancel")).toBeDisabled();
	});

	it("habilita botão confirmar após selecionar uma imagem", async () => {
		const user = userEvent.setup();
		setupAuthMock({ user: mockUser });
		jest.mocked(launchImageLibraryAsync).mockResolvedValue({
			canceled: false,
			assets: [{ uri: "fake-uri" }],
		} as unknown as Awaited<ReturnType<typeof launchImageLibraryAsync>>);

		await renderProfile();
		await user.press(screen.getByTestId("avatar-touchable"));

		await waitFor(() => {
			expect(screen.getByTestId("btn-confirm")).not.toBeDisabled();
		});
	});

	it("chama putV1ProfilesAvatar ao salvar com imagem selecionada", async () => {
		const user = userEvent.setup();
		const mockUpdateUserProfile = jest.fn();
		setupAuthMock({ user: mockUser, updateUserProfile: mockUpdateUserProfile });

		jest.mocked(launchImageLibraryAsync).mockResolvedValue({
			canceled: false,
			assets: [{ uri: "fake-uri" }],
		} as unknown as Awaited<ReturnType<typeof launchImageLibraryAsync>>);
		jest.mocked(putV1ProfilesAvatar).mockResolvedValue({
			data: { id: "img-1", url: "http://new-avatar.url" },
		} as unknown as Awaited<ReturnType<typeof putV1ProfilesAvatar>>);

		await renderProfile();
		await user.press(screen.getByTestId("avatar-touchable"));

		const confirmBtn = screen.getByTestId("btn-confirm");
		await waitFor(() => {
			expect(confirmBtn).not.toBeDisabled();
		});
		await user.press(confirmBtn);

		await waitFor(() => {
			expect(putV1ProfilesAvatar).toHaveBeenCalled();
			expect(mockUpdateUserProfile).toHaveBeenCalled();
		});
	});
});
