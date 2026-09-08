import {
	getV1Profiles,
	getV1UsersMe,
} from "@oikos-circular-environment/oikos-sdk";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	fireEvent,
	render,
	screen,
	userEvent,
	waitFor,
} from "@testing-library/react-native";
import { useRouter } from "expo-router";
import type React from "react";
import { Pressable, Text, View } from "react-native";
import SignInScreen from "@/app/(tabs)/(home)/sign-in";
import { toast } from "@/components/toast";
import { AuthContextProvider, useAuthContext } from "@/contexts/auth-context";
import { setAuthToken } from "@/libs/api/oikos-api";
import { authClient } from "@/libs/auth/auth-client";

jest.mock("expo-router", () => ({
	useRouter: jest.fn(),
	Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("@oikos-circular-environment/oikos-sdk", () => ({
	getV1Profiles: jest.fn(),
	getV1UsersMe: jest.fn(),
	deleteV1UsersMe: jest.fn(),
	patchV1UsersMeCancelDeletion: jest.fn(),
}));

jest.mock("@/libs/auth/auth-client", () => ({
	authClient: {
		signIn: { email: jest.fn() },
		signUp: { email: jest.fn() },
		signOut: jest.fn().mockResolvedValue({ data: {}, error: null }),
		changePassword: jest.fn(),
	},
}));

jest.mock("@/libs/storage", () => ({
	getAuthToken: jest.fn().mockResolvedValue(null),
	saveAuthToken: jest.fn().mockResolvedValue(undefined),
	removeAuthToken: jest.fn().mockResolvedValue(undefined),
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

function mockEmailSignIn(token = "access-token") {
	jest
		.mocked(authClient.signIn.email)
		.mockImplementation(async (_body, options) => {
			await options?.onSuccess?.({
				response: { headers: new Headers({ "set-auth-token": token }) },
			} as never);
			return { data: {}, error: null } as never;
		});
}

function AuthStateHarness() {
	const { signOut, isAuthenticated } = useAuthContext();
	return (
		<View>
			<Text testID="auth-status">
				{isAuthenticated ? "autenticado" : "nao-autenticado"}
			</Text>
			<Pressable testID="sign-out-btn" onPress={() => signOut()}>
				<Text>Sair</Text>
			</Pressable>
		</View>
	);
}

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

	describe("SignIn", () => {
		it("chama a API com as credenciais e navega para home quando o perfil existe", async () => {
			mockEmailSignIn();
			jest.mocked(getV1Profiles).mockResolvedValue({
				data: { profile: { id: "user-1", name: "Test User" } },
			} as unknown as Awaited<ReturnType<typeof getV1Profiles>>);
			jest.mocked(getV1UsersMe).mockResolvedValue({
				data: {
					user: {
						id: "user-1",
						email: "user@example.com",
						created_at: new Date(),
						deleted_at: null,
					},
				},
			} as unknown as Awaited<ReturnType<typeof getV1UsersMe>>);

			const user = userEvent.setup();
			await renderWithAuth(<SignInScreen />);

			await user.type(
				screen.getByPlaceholderText("seu@email.com"),
				"user@example.com",
			);
			await user.type(screen.getByPlaceholderText("••••••••"), "senha1234");
			await user.press(screen.getByRole("button", { name: "Entrar" }));

			await waitFor(() => {
				expect(authClient.signIn.email).toHaveBeenCalledWith(
					{ email: "user@example.com", password: "senha1234" },
					expect.objectContaining({ onSuccess: expect.any(Function) }),
				);
				expect(mockRouter.push).toHaveBeenCalledWith("/(tabs)/(home)");
			});
		});

		it("navega para completar perfil quando o usuário não possui perfil cadastrado", async () => {
			mockEmailSignIn();
			jest.mocked(getV1Profiles).mockResolvedValue({
				data: {},
			} as unknown as Awaited<ReturnType<typeof getV1Profiles>>);
			jest.mocked(getV1UsersMe).mockResolvedValue({
				data: {
					user: {
						id: "user-1",
						email: "user@example.com",
						created_at: new Date(),
						deleted_at: null,
					},
				},
			} as unknown as Awaited<ReturnType<typeof getV1UsersMe>>);

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
			jest.mocked(authClient.signIn.email).mockResolvedValue({
				data: null,
				error: { code: "INVALID_EMAIL_OR_PASSWORD" },
			} as never);

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

	describe("SignOut", () => {
		it("reseta o estado de autenticação, navega para home e exibe toast", async () => {
			setAuthToken("existing-access-token");
			jest.mocked(getV1Profiles).mockResolvedValue({
				data: { profile: { id: "user-1", name: "Test User" } },
			} as unknown as Awaited<ReturnType<typeof getV1Profiles>>);
			jest.mocked(getV1UsersMe).mockResolvedValue({
				data: {
					user: {
						id: "user-1",
						email: "user@example.com",
						created_at: new Date(),
						deleted_at: null,
					},
				},
			} as unknown as Awaited<ReturnType<typeof getV1UsersMe>>);

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
			expect(jest.mocked(authClient.signOut)).toHaveBeenCalledTimes(1);
		});
	});
});
