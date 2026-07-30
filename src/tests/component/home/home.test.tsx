import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, userEvent } from "@testing-library/react-native";
import type React from "react";
import HomeScreen from "@/app/(tabs)/(home)";
import { useAuthContext } from "@/contexts/auth-context";
import { useGeospatial } from "@/contexts/geospatial-context";
import { useSurveyStore } from "@/stores/survey-store";

jest.mock("expo-router", () => ({
	useRouter: () => ({ push: jest.fn(), navigate: jest.fn(), back: jest.fn() }),
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

jest.mock("@/components/ui/grid", () => ({
	Grid: ({ children }: { children: React.ReactNode }) => <>{children}</>,
	GridItem: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("@/components/home/home-guest-card", () => {
	const { View: V } = require("react-native");
	return { HomeGuestCard: () => <V testID="home-guest-card" /> };
});

jest.mock("@/components/home/home-user-card", () => {
	const { View: V } = require("react-native");
	return { HomeUserCard: () => <V testID="home-user-card" /> };
});

jest.mock("@/components/home/home-header-skeleton", () => {
	const { View: V } = require("react-native");
	return { HomeHeaderSkeleton: () => <V testID="home-header-skeleton" /> };
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
	});

	afterEach(() => {
		jest.useRealTimers();
		jest.clearAllMocks();
	});

	it("exibe o convite da pesquisa quando não há participação iniciada", async () => {
		await renderHome();

		expect(
			screen.getByText("Participe e ajude a melhorar o app"),
		).toBeOnTheScreen();
	});

	it("troca o rótulo do convite para retomada quando há participação em andamento", async () => {
		useSurveyStore.getState().startSession("session-1");
		await renderHome();

		expect(screen.getByText("Continue de onde parou")).toBeOnTheScreen();
		expect(
			screen.queryByText("Participe e ajude a melhorar o app"),
		).not.toBeOnTheScreen();
	});

	it("some o convite da pesquisa quando a participação está concluída", async () => {
		useSurveyStore.getState().startSession("session-1");
		useSurveyStore.getState().setStatus("COMPLETED");
		await renderHome();

		expect(screen.queryByText("Pesquisa de usabilidade")).not.toBeOnTheScreen();
	});

	it("exibe skeleton enquanto isLoading é true", async () => {
		setupAuth({ isLoading: true });
		await renderHome();

		expect(screen.getByTestId("home-header-skeleton")).toBeOnTheScreen();
		expect(screen.queryByTestId("home-guest-card")).not.toBeOnTheScreen();
		expect(screen.queryByTestId("home-user-card")).not.toBeOnTheScreen();
	});

	it("renderiza HomeGuestCard quando não autenticado", async () => {
		await renderHome();

		expect(screen.getByTestId("home-guest-card")).toBeOnTheScreen();
		expect(screen.queryByTestId("home-user-card")).not.toBeOnTheScreen();
		expect(screen.queryByTestId("home-header-skeleton")).not.toBeOnTheScreen();
	});

	it("renderiza HomeUserCard quando autenticado", async () => {
		setupAuth({ isAuthenticated: true, user: {} as never });
		await renderHome();

		expect(screen.getByTestId("home-user-card")).toBeOnTheScreen();
		expect(screen.queryByTestId("home-guest-card")).not.toBeOnTheScreen();
	});

	it("exibe Pontos de Coleta e Denúncias (sempre visíveis)", async () => {
		await renderHome();

		expect(screen.getByText("Pontos de Coleta")).toBeOnTheScreen();
		expect(screen.getByText("Denúncias")).toBeOnTheScreen();
	});

	it("exibe card Empresas apenas quando autenticado", async () => {
		await renderHome();
		expect(screen.queryByText("Empresas")).not.toBeOnTheScreen();

		setupAuth({ isAuthenticated: true, user: {} as never });
		await renderHome();
		expect(screen.getByText("Empresas")).toBeOnTheScreen();
	});

	it("abre modal de finalizar cadastro ao pressionar Empresas com needsProfileCompletion", async () => {
		const user = userEvent.setup();
		setupAuth({
			isAuthenticated: true,
			needsProfileCompletion: true,
			user: {} as never,
		});
		await renderHome();

		await user.press(screen.getByText("Empresas"));

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

		await user.press(screen.getByText("Empresas"));
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

		await user.press(screen.getByText("Empresas"));

		expect(screen.getByTestId("modal-description")).toHaveTextContent(
			"Para acessar o gerenciamento de empresas você precisa finalizar o seu cadastro.",
		);
	});
});
