import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, userEvent } from "@testing-library/react-native";
import type React from "react";
import HomeScreen from "@/app/(tabs)/(home)";
import { useSurveyProtocol } from "@/components/survey/hooks/use-survey-protocol";
import { useAuthContext } from "@/contexts/auth-context";
import { useGeospatial } from "@/contexts/geospatial-context";
import { useSurveyStore } from "@/stores/survey-store";

jest.mock("@/components/survey/hooks/use-survey-protocol");

const protocolFixture = {
	key: "oikos-walkthrough",
	version: 1,
	personas: [],
	suites: [],
	tasks: [],
	questions: [],
};

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
	useRouter: () => ({ push: mockPush, navigate: jest.fn(), back: jest.fn() }),
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
		if (asChild) {
			return React.cloneElement(React.Children.only(children));
		}
		return React.createElement(Pressable, null, children);
	},
}));

jest.mock("@/contexts/auth-context");
jest.mock("@/contexts/geospatial-context");

jest.mock("@/components/home/home-hero", () => {
	const { Pressable: P, Text: T, View: V } = require("react-native");
	return {
		HomeHero: ({
			isAuthenticated,
			isLoading,
			onOpenSettings,
			onPressLogin,
		}: {
			isAuthenticated: boolean;
			isLoading: boolean;
			onOpenSettings: () => void;
			onPressLogin: () => void;
		}) => (
			<V testID="home-hero">
				<T testID="home-hero-is-loading">{String(isLoading)}</T>
				<T testID="home-hero-is-authenticated">{String(isAuthenticated)}</T>
				<P testID="home-hero-open-settings" onPress={onOpenSettings}>
					<T>Configurações</T>
				</P>
				<P testID="home-hero-press-login" onPress={onPressLogin}>
					<T>Iniciar sessão</T>
				</P>
			</V>
		),
	};
});

jest.mock("@/components/settings/settings-bottom-sheet", () => {
	const { View: V } = require("react-native");
	return {
		SettingsBottomSheet: require("react").forwardRef(() => (
			<V testID="settings-bottom-sheet" />
		)),
	};
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
		const { Text, Pressable, View: RV } = require("react-native");
		return (
			<RV testID="profile-completion-modal">
				<Text testID="modal-is-open">{String(isOpen)}</Text>
				<Pressable testID="modal-close-btn" onPress={onClose}>
					<Text>Fechar</Text>
				</Pressable>
				{description ? (
					<Text testID="modal-description">{description}</Text>
				) : null}
			</RV>
		);
	},
}));

jest.mock("@/components/auth/auth-modal", () => ({
	AuthModal: ({
		isOpen,
		onClose,
		description,
	}: {
		isOpen: boolean;
		onClose: () => void;
		description?: string;
	}) => {
		const { Text, Pressable, View: RV } = require("react-native");
		return (
			<RV testID="auth-modal">
				<Text testID="auth-modal-is-open">{String(isOpen)}</Text>
				<Pressable testID="auth-modal-close-btn" onPress={onClose}>
					<Text>Fechar</Text>
				</Pressable>
				{description ? (
					<Text testID="auth-modal-description">{description}</Text>
				) : null}
			</RV>
		);
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
	refreshSession: jest.fn(),
	requestDeletion: jest.fn(),
	cancelDeletion: jest.fn(),
	isRequestingDeletion: false,
	account: null,
	changePassword: jest.fn(),
	isChangingPassword: false,
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

describe("HomeScreen — componente", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		setupAuth();
		setupGeospatial();
		useSurveyStore.getState().reset();
		jest.mocked(useSurveyProtocol).mockReturnValue({
			data: protocolFixture,
		} as never);
	});

	afterEach(() => {
		jest.useRealTimers();
		jest.clearAllMocks();
	});

	it("exibe o convite da pesquisa quando não há participação iniciada", async () => {
		await renderHome();

		expect(screen.getByText("Ajude a melhorar o Oikos")).toBeOnTheScreen();
	});

	it("troca o rótulo do convite para retomada quando há participação em andamento", async () => {
		useSurveyStore.getState().startSession("session-1", "COLLECTOR");
		await renderHome();

		expect(screen.getByText("Continue de onde parou")).toBeOnTheScreen();
		expect(
			screen.queryByText("Ajude a melhorar o Oikos"),
		).not.toBeOnTheScreen();
	});

	it("some o convite da pesquisa quando a participação está concluída", async () => {
		useSurveyStore.getState().startSession("session-1", "COLLECTOR");
		useSurveyStore.getState().setStatus("COMPLETED");
		await renderHome();

		expect(
			screen.queryByText("Ajude a melhorar o Oikos"),
		).not.toBeOnTheScreen();
		expect(screen.queryByText("Continue de onde parou")).not.toBeOnTheScreen();
	});

	it("esconde o convite quando o survey está inativo no servidor", async () => {
		jest.mocked(useSurveyProtocol).mockReturnValue({ data: null } as never);
		await renderHome();

		expect(
			screen.queryByText("Ajude a melhorar o Oikos"),
		).not.toBeOnTheScreen();
	});

	it("repassa isLoading para o HomeHero", async () => {
		setupAuth({ isLoading: true });
		await renderHome();

		expect(screen.getByTestId("home-hero-is-loading")).toHaveTextContent(
			"true",
		);
	});

	it("repassa isAuthenticated=false para o HomeHero quando não autenticado", async () => {
		await renderHome();

		expect(screen.getByTestId("home-hero-is-authenticated")).toHaveTextContent(
			"false",
		);
	});

	it("repassa isAuthenticated=true para o HomeHero quando autenticado", async () => {
		setupAuth({ isAuthenticated: true, user: {} as never });
		await renderHome();

		expect(screen.getByTestId("home-hero-is-authenticated")).toHaveTextContent(
			"true",
		);
	});

	it("navega para o login quando o HomeHero conclui o slide de iniciar sessão", async () => {
		const user = userEvent.setup();
		await renderHome();

		await user.press(screen.getByTestId("home-hero-press-login"));

		expect(mockPush).toHaveBeenCalledWith("/sign-in");
	});

	it("exibe os 3 cards do carrossel de serviços sempre, mesmo deslogado", async () => {
		await renderHome();

		expect(screen.getByText("RECICLAGEM")).toBeOnTheScreen();
		expect(screen.getByText("DENÚNCIAS")).toBeOnTheScreen();
		expect(screen.getByText("EMPRESAS")).toBeOnTheScreen();
	});

	it("abre AuthModal ao pressionar CTA de Empresas quando não autenticado", async () => {
		const user = userEvent.setup();
		await renderHome();

		await user.press(screen.getByText("Cadastrar agora"));

		expect(screen.getByTestId("auth-modal-is-open")).toHaveTextContent("true");
		expect(screen.getByTestId("auth-modal-description")).toHaveTextContent(
			"Para cadastrar sua empresa você precisa ter uma conta. Cadastre-se gratuitamente e ajude a proteger o meio ambiente.",
		);
	});

	it("abre modal de finalizar cadastro ao pressionar CTA de Empresas com needsProfileCompletion", async () => {
		const user = userEvent.setup();
		setupAuth({
			isAuthenticated: true,
			needsProfileCompletion: true,
			user: {} as never,
		});
		await renderHome();

		await user.press(screen.getByText("Cadastrar agora"));

		expect(screen.getByTestId("modal-is-open")).toHaveTextContent("true");
	});

	it("fecha modal ao pressionar botão de fechar", async () => {
		const user = userEvent.setup();
		setupAuth({
			isAuthenticated: true,
			needsProfileCompletion: true,
			user: {} as never,
		});
		await renderHome();

		await user.press(screen.getByText("Cadastrar agora"));
		expect(screen.getByTestId("modal-is-open")).toHaveTextContent("true");

		await user.press(screen.getByTestId("modal-close-btn"));
		expect(screen.getByTestId("modal-is-open")).toHaveTextContent("false");
	});

	it("passa description correta para o modal", async () => {
		const user = userEvent.setup();
		setupAuth({
			isAuthenticated: true,
			needsProfileCompletion: true,
			user: {} as never,
		});
		await renderHome();

		await user.press(screen.getByText("Cadastrar agora"));

		expect(screen.getByTestId("modal-description")).toHaveTextContent(
			"Para acessar o gerenciamento de empresas você precisa finalizar o seu cadastro.",
		);
	});
});
