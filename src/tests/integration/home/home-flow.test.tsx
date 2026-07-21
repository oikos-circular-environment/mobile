import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, userEvent } from "@testing-library/react-native";
import type React from "react";
import HomeScreen from "@/app/(tabs)/(home)";
import { useAuthContext } from "@/contexts/auth-context";
import { useGeospatial } from "@/contexts/geospatial-context";
import { makeAddress, makeProfile, makeUser } from "@/tests/factories";

const mockLinkPress = jest.fn();

jest.mock("expo-router", () => ({
	Link: ({
		children,
		asChild,
	}: {
		children: React.ReactNode;
		asChild?: boolean;
		href?: unknown;
	}) => {
		const React = require("react");
		const { Pressable } = require("react-native");
		const wrapped = (onPress?: () => void) =>
			React.createElement(Pressable, { onPress }, children);
		if (asChild) {
			const child = React.Children.only(children);
			return React.cloneElement(child, {
				onPress: () => mockLinkPress(),
			});
		}
		return wrapped(() => mockLinkPress());
	},
}));

jest.mock("@/contexts/auth-context");
jest.mock("@/contexts/geospatial-context");

jest.mock("@/components/ui/grid", () => {
	const R = require("react");
	return {
		Grid: ({ children }: { children: React.ReactNode }) =>
			R.createElement(R.Fragment, null, children),
		GridItem: ({ children }: { children: React.ReactNode }) =>
			R.createElement(R.Fragment, null, children),
	};
});

jest.mock("@/components/home/home-header-skeleton", () => {
	const { View: V } = require("react-native");
	return { HomeHeaderSkeleton: () => <V testID="home-header-skeleton" /> };
});

jest.mock("expo-image", () => ({
	Image: () => null,
}));

jest.mock("@/components/settings/settings-bottom-sheet", () => {
	const { View: V } = require("react-native");
	return {
		SettingsBottomSheet: require("react").forwardRef(() => (
			<V testID="settings-bottom-sheet" />
		)),
	};
});

jest.mock("@/components/settings/delete-account-modal", () => {
	const { View: V } = require("react-native");
	return { DeleteAccountModal: () => <V testID="delete-account-modal" /> };
});

jest.mock("@/components/auth/profile-completion-modal", () => ({
	ProfileCompletionModal: ({
		isOpen,
		onClose,
		description,
	}: {
		isOpen: boolean;
		onClose: () => void;
		description?: string;
	}) => {
		const { Pressable, Text: T, View: V } = require("react-native");
		return (
			<V testID="profile-completion-modal">
				<T testID="modal-is-open">{String(isOpen)}</T>
				<Pressable testID="modal-close-btn" onPress={onClose}>
					<T>Fechar</T>
				</Pressable>
				{description ? <T testID="modal-description">{description}</T> : null}
			</V>
		);
	},
}));

jest.mock("@/components/toast", () => ({
	Toaster: () => null,
	toast: {
		success: jest.fn(),
		error: jest.fn(),
		info: jest.fn(),
		warning: jest.fn(),
		close: jest.fn(),
		closeAll: jest.fn(),
	},
}));

const defaultAuth = {
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
};

function setupAuth(overrides: Partial<typeof defaultAuth> = {}) {
	jest.mocked(useAuthContext).mockReturnValue({
		...defaultAuth,
		...overrides,
	});
}

const defaultGeospatial = {
	heading: null,
	location: null,
	addresses: [],
	permissionDenied: false,
	isResolving: false,
	reverseGeocodeError: false,
};

function setupGeospatial(overrides: Partial<typeof defaultGeospatial> = {}) {
	jest
		.mocked(useGeospatial)
		.mockReturnValue({ ...defaultGeospatial, ...overrides });
}

async function renderHome() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});
	return await render(
		<QueryClientProvider client={queryClient}>
			<HomeScreen />
		</QueryClientProvider>,
	);
}

describe("HomeScreen — integração", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		mockLinkPress.mockReset();
		setupAuth();
		setupGeospatial();
	});

	afterEach(() => {
		jest.useRealTimers();
		jest.clearAllMocks();
	});

	it("renderiza GuestCard com boas-vindas para visitante", async () => {
		setupAuth({ isAuthenticated: false });
		await renderHome();

		expect(screen.getByText("Bem-Vindos a Oikos!")).toBeOnTheScreen();
	});

	it("renderiza UserCard com nome de exibição para usuário logado", async () => {
		setupAuth({
			isAuthenticated: true,
			user: makeUser({
				profile: makeProfile({
					user_id: "u1",
					id: "p1",
					full_name: "João Silva",
					display_name: "João",
					phone: "11999999999",
					address: makeAddress({
						id: "a1",
						zip_code: "01310100",
						street: "Av Paulista",
						number: "1000",
						complement: null,
						district: "Bela Vista",
						city: "São Paulo",
						city_ibge_id: 3550308,
						state: "São Paulo",
						state_code: "SP",
						state_ibge_id: 35,
						latitude: -23.55,
						longitude: -46.63,
					}),
				}),
			}) as never,
		});
		await renderHome();

		expect(screen.getByText("João")).toBeOnTheScreen();
	});

	it("renderiza card de cadastro pendente quando autenticado sem perfil", async () => {
		setupAuth({ isAuthenticated: true, user: null });
		await renderHome();

		expect(screen.getByText("Finalize seu cadastro")).toBeOnTheScreen();
	});

	it("exibe título da seção Serviços", async () => {
		await renderHome();

		expect(screen.getByText("Serviços")).toBeOnTheScreen();
	});

	it("transita de skeleton → UserCard ao fim do carregamento", async () => {
		setupAuth({ isLoading: true });
		await renderHome();

		expect(screen.getByTestId("home-header-skeleton")).toBeOnTheScreen();

		setupAuth({
			isLoading: false,
			isAuthenticated: true,
			user: makeUser({
				profile: makeProfile({
					user_id: "u1",
					id: "p1",
					full_name: "Maria Souza",
					display_name: "Maria",
					phone: "11988888888",
					profile_image: {
						id: "pi-1",
						url: "https://example.com/avatar.jpg",
						file_name: "avatar.jpg",
						path: "/avatars/avatar.jpg",
						created_at: new Date("2025-01-01"),
					},
					address: makeAddress({
						id: "a1",
						zip_code: "01310100",
						street: "Av Paulista",
						number: "500",
						complement: null,
						district: "Bela Vista",
						city: "São Paulo",
						city_ibge_id: 3550308,
						state: "São Paulo",
						state_code: "SP",
						state_ibge_id: 35,
						latitude: -23.55,
						longitude: -46.63,
					}),
				}),
			}) as never,
		});
		await renderHome();

		expect(screen.getByText("Maria")).toBeOnTheScreen();
		expect(screen.queryByTestId("home-header-skeleton")).not.toBeOnTheScreen();
	});

	it("abre modal de finalizar cadastro ao pressionar Empresas com needsProfileCompletion", async () => {
		const user = userEvent.setup();
		setupAuth({
			isAuthenticated: true,
			needsProfileCompletion: true,
			user: null,
		});
		await renderHome();

		await user.press(screen.getByText("Empresas"));

		expect(screen.getByTestId("modal-is-open")).toHaveTextContent("true");
		expect(screen.getByTestId("modal-description")).toHaveTextContent(
			"Para acessar o gerenciamento de empresas você precisa finalizar o seu cadastro.",
		);
	});

	it("fecha modal ao pressionar botão de fechar", async () => {
		const user = userEvent.setup();
		setupAuth({
			isAuthenticated: true,
			needsProfileCompletion: true,
			user: null,
		});
		await renderHome();

		await user.press(screen.getByText("Empresas"));
		expect(screen.getByTestId("modal-is-open")).toHaveTextContent("true");

		await user.press(screen.getByTestId("modal-close-btn"));
		expect(screen.getByTestId("modal-is-open")).toHaveTextContent("false");
	});
});
