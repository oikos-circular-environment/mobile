import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	fireEvent,
	render,
	screen,
	userEvent,
	waitFor,
} from "@testing-library/react-native";
import { AxiosError } from "axios";
import { useRouter } from "expo-router";
import type React from "react";
import { Pressable, Text, View } from "react-native";
import SignInScreen from "@/app/(tabs)/(home)/sign-in";
import { toast } from "@/components/toast";
import { AuthContextProvider, useAuthContext } from "@/contexts/auth-context";
import { setAuthToken } from "@/libs/api/oikos-api";
import { getV1Profiles, postV1AuthLogin } from "@/libs/oikos-sdk";

jest.mock("expo-router", () => ({
	useRouter: jest.fn(),
	Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("@/libs/oikos-sdk", () => ({
	postV1AuthLogin: jest.fn(),
	getV1Profiles: jest.fn(),
	postV1UsersRegister: jest.fn(),
}));

jest.mock("@/libs/storage", () => ({
	getAuthToken: jest.fn().mockResolvedValue(null),
	saveAuthToken: jest.fn().mockResolvedValue(undefined),
	removeAuthToken: jest.fn().mockResolvedValue(undefined),
	getRefreshToken: jest.fn().mockResolvedValue(null),
	saveRefreshToken: jest.fn().mockResolvedValue(undefined),
	removeRefreshToken: jest.fn().mockResolvedValue(undefined),
	clearTokens: jest.fn().mockResolvedValue(undefined),
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

// ---------------------------------------------------------------------------
// Helper component used in sign-out tests
// ---------------------------------------------------------------------------
function AuthStateHarness() {
	const { signOut, isAuthenticated } = useAuthContext();
	return (
		<View>
			<Text testID="auth-status">
				{isAuthenticated ? "autenticado" : "nao-autenticado"}
			</Text>
			<Pressable testID="sign-out-btn" onPress={signOut}>
				<Text>Sair</Text>
			</Pressable>
		</View>
	);
}

// ---------------------------------------------------------------------------
// Shared setup
// ---------------------------------------------------------------------------
const mockRouter = {
	push: jest.fn(),
	back: jest.fn(),
	navigate: jest.fn(),
	replace: jest.fn(),
};

async function renderWithAuth(ui: React.ReactElement) {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});
	return await render(
		<QueryClientProvider client={queryClient}>
			<AuthContextProvider>{ui}</AuthContextProvider>
		</QueryClientProvider>,
	);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("Fluxo de autenticação — integração", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest
			.mocked(useRouter)
			.mockReturnValue(mockRouter as unknown as ReturnType<typeof useRouter>);
	});

	afterEach(() => {
		jest.useRealTimers();
		jest.clearAllMocks();
		// Reset module-level token state between tests
		setAuthToken(null);
	});

	// -------------------------------------------------------------------------
	// Sign-in
	// -------------------------------------------------------------------------
	describe("SignIn", () => {
		it("chama a API com as credenciais e navega para home quando o perfil existe", async () => {
			jest.mocked(postV1AuthLogin).mockResolvedValue({
				data: { token: "access-token", refreshToken: "refresh-token" },
			} as unknown as Awaited<ReturnType<typeof postV1AuthLogin>>);
			jest.mocked(getV1Profiles).mockResolvedValue({
				data: { profile: { id: "user-1", name: "Test User" } },
			} as unknown as Awaited<ReturnType<typeof getV1Profiles>>);

			const user = userEvent.setup();
			await renderWithAuth(<SignInScreen />);

			await user.type(
				screen.getByPlaceholderText("seu@email.com"),
				"user@example.com",
			);
			await user.type(screen.getByPlaceholderText("••••••••"), "senha1234");
			await user.press(screen.getByRole("button", { name: "Entrar" }));

			await waitFor(() => {
				expect(postV1AuthLogin).toHaveBeenCalledWith({
					body: { email: "user@example.com", password: "senha1234" },
				});
				expect(mockRouter.push).toHaveBeenCalledWith("/(tabs)/(home)");
			});
		});

		it("navega para completar perfil quando o usuário não possui perfil cadastrado", async () => {
			jest.mocked(postV1AuthLogin).mockResolvedValue({
				data: { token: "access-token", refreshToken: "refresh-token" },
			} as unknown as Awaited<ReturnType<typeof postV1AuthLogin>>);
			// empty profile: onSuccess redirects to /profile
			jest.mocked(getV1Profiles).mockResolvedValue({
				data: {},
			} as unknown as Awaited<ReturnType<typeof getV1Profiles>>);

			const user = userEvent.setup();
			await renderWithAuth(<SignInScreen />);

			await user.type(
				screen.getByPlaceholderText("seu@email.com"),
				"user@example.com",
			);
			await user.type(screen.getByPlaceholderText("••••••••"), "senha1234");
			await user.press(screen.getByRole("button", { name: "Entrar" }));

			await waitFor(() => {
				expect(mockRouter.push).toHaveBeenCalledWith("/(tabs)/(home)/profile");
			});
		});

		it("exibe toast de erro e não navega quando as credenciais são inválidas", async () => {
			const error = Object.assign(new AxiosError("Unauthorized"), {
				response: { data: { code: "INVALID_CREDENTIALS" }, status: 401 },
			});
			jest.mocked(postV1AuthLogin).mockRejectedValue(error);

			const user = userEvent.setup();
			await renderWithAuth(<SignInScreen />);

			await user.type(
				screen.getByPlaceholderText("seu@email.com"),
				"user@example.com",
			);
			await user.type(screen.getByPlaceholderText("••••••••"), "senha1234");
			await user.press(screen.getByRole("button", { name: "Entrar" }));

			await waitFor(() => {
				expect(jest.mocked(toast.error)).toHaveBeenCalledWith(
					"Verifique suas credenciais",
					"Os dados estão incorretos ou não existem.",
				);
			});
			expect(mockRouter.push).not.toHaveBeenCalled();
		});
	});

	// -------------------------------------------------------------------------
	// Sign-out
	// -------------------------------------------------------------------------
	describe("SignOut", () => {
		it("reseta o estado de autenticação, navega para home e exibe toast", async () => {
			// Seed a valid token so the auth context initializes as authenticated
			setAuthToken("existing-access-token");
			jest.mocked(getV1Profiles).mockResolvedValue({
				data: { profile: { id: "user-1", name: "Test User" } },
			} as unknown as Awaited<ReturnType<typeof getV1Profiles>>);

			await renderWithAuth(<AuthStateHarness />);

			// Wait for the auth context to finish loading the profile
			await waitFor(() => {
				expect(screen.getByTestId("auth-status")).toHaveTextContent(
					"autenticado",
				);
			});

			fireEvent.press(screen.getByTestId("sign-out-btn"));

			await waitFor(() => {
				expect(screen.getByTestId("auth-status")).toHaveTextContent(
					"nao-autenticado",
				);
			});
			expect(mockRouter.navigate).toHaveBeenCalledWith("/(tabs)/(home)");
			expect(jest.mocked(toast.success)).toHaveBeenCalledWith(
				"Você foi deslogado com sucesso!",
			);
		});
	});
});
