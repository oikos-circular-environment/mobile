import {
	fireEvent,
	render,
	screen,
	userEvent,
} from "@testing-library/react-native";
import type React from "react";
import SignInScreen from "@/app/(tabs)/(home)/sign-in";
import { useAuthContext } from "@/contexts/auth-context";

jest.mock("expo-router", () => ({
	useRouter: () => ({ back: jest.fn() }),
	Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("@/contexts/auth-context");

const mockSignIn = jest.fn();

function setupAuthMock(overrides: Record<string, unknown> = {}) {
	jest.mocked(useAuthContext).mockReturnValue({
		signIn: mockSignIn,
		signUp: jest.fn(),
		signOut: jest.fn(),
		isLoading: false,
		isAuthenticated: false,
		user: null,
		needsProfileCompletion: false,
		updateUserProfile: jest.fn(),
		...overrides,
	});
}

describe("SignInScreen", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		setupAuthMock();
	});

	afterEach(() => {
		jest.useRealTimers();
		jest.clearAllMocks();
	});

	it("renderiza os campos de email e senha", async () => {
		await render(<SignInScreen />);

		expect(screen.getByPlaceholderText("seu@email.com")).toBeOnTheScreen();
		expect(screen.getByPlaceholderText("••••••••")).toBeOnTheScreen();
		expect(screen.getByRole("button", { name: "Entrar" })).toBeOnTheScreen();
	});

	it("exibe erro de validação para email inválido", async () => {
		const user = userEvent.setup();
		await render(<SignInScreen />);

		await user.type(
			screen.getByPlaceholderText("seu@email.com"),
			"email-invalido",
		);
		await user.press(screen.getByRole("button", { name: "Entrar" }));

		expect(
			await screen.findByText("Digite um e-mail válido."),
		).toBeOnTheScreen();
	});

	it("exibe erro de validação para senha com menos de 8 caracteres", async () => {
		const user = userEvent.setup();
		await render(<SignInScreen />);

		await user.type(
			screen.getByPlaceholderText("seu@email.com"),
			"user@example.com",
		);
		await user.type(screen.getByPlaceholderText("••••••••"), "1234567");
		await user.press(screen.getByRole("button", { name: "Entrar" }));

		expect(
			await screen.findByText("A senha precisa ter no mínimo 8 caracteres."),
		).toBeOnTheScreen();
	});

	it("chama signIn com os dados corretos ao submeter form válido", async () => {
		const user = userEvent.setup();
		await render(<SignInScreen />);

		await user.type(
			screen.getByPlaceholderText("seu@email.com"),
			"user@example.com",
		);
		await user.type(screen.getByPlaceholderText("••••••••"), "senha1234");
		await user.press(screen.getByRole("button", { name: "Entrar" }));

		expect(mockSignIn).toHaveBeenCalledWith({
			email: "user@example.com",
			password: "senha1234",
		});
	});

	it("desabilita o botão e exibe spinner quando isLoading é true", async () => {
		setupAuthMock({ isLoading: true });
		await render(<SignInScreen />);

		// Quando isLoading=true, o nome acessível do botão inclui "loading" do spinner
		expect(screen.getByRole("button", { name: /Entrar/i })).toBeDisabled();
		expect(screen.getByLabelText("loading")).toBeOnTheScreen();
	});

	it("alterna a visibilidade da senha ao pressionar o ícone de toggle", async () => {
		await render(<SignInScreen />);

		const passwordInput = screen.getByPlaceholderText("••••••••");
		expect(passwordInput).toHaveProp("secureTextEntry", true);

		// InputSlot é accessibilityElementsHidden, requer includeHiddenElements
		await fireEvent.press(
			screen.getByTestId("toggle-password", { includeHiddenElements: true }),
		);

		expect(passwordInput).toHaveProp("secureTextEntry", false);
	});
});
