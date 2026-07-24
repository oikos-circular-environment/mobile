import {
	fireEvent,
	render,
	screen,
	userEvent,
} from "@testing-library/react-native";
import type React from "react";
import SignUpScreen from "@/app/(tabs)/(home)/sign-up";
import { useAuthContext } from "@/contexts/auth-context";

jest.mock("expo-router", () => ({
	useRouter: () => ({ back: jest.fn() }),
	Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("@/contexts/auth-context");

const mockSignUp = jest.fn();

function setupAuthMock(overrides: Record<string, unknown> = {}) {
	jest.mocked(useAuthContext).mockReturnValue({
		signIn: jest.fn(),
		signUp: mockSignUp,
		signOut: jest.fn(),
		isLoading: false,
		isAuthenticated: false,
		user: null,
		needsProfileCompletion: false,
		deletionScheduledAt: null,
		requestDeletion: jest.fn(),
		cancelDeletion: jest.fn(),
		isRequestingDeletion: false,
		account: null,
		changePassword: jest.fn(),
		isChangingPassword: false,
		isCancellingDeletion: false,
		updateUserProfile: jest.fn(),
		...overrides,
	});
}

describe("SignUpScreen", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		setupAuthMock();
	});

	afterEach(() => {
		jest.useRealTimers();
		jest.clearAllMocks();
	});

	it("renderiza os campos de email, senha e confirmar senha", async () => {
		await render(<SignUpScreen />);

		expect(screen.getByPlaceholderText("seu@email.com")).toBeOnTheScreen();
		expect(screen.getAllByPlaceholderText("••••••••")).toHaveLength(2);
		expect(
			screen.getByRole("button", { name: "Criar Conta" }),
		).toBeOnTheScreen();
	});

	it("exibe erro de validação para email inválido", async () => {
		const user = userEvent.setup();
		await render(<SignUpScreen />);

		await user.type(
			screen.getByPlaceholderText("seu@email.com"),
			"email-invalido",
		);
		await user.press(screen.getByRole("button", { name: "Criar Conta" }));

		expect(
			await screen.findByText("Digite um e-mail válido."),
		).toBeOnTheScreen();
	});

	it("exibe erro de validação para senha com menos de 8 caracteres", async () => {
		const user = userEvent.setup();
		await render(<SignUpScreen />);

		await user.type(
			screen.getByPlaceholderText("seu@email.com"),
			"user@example.com",
		);
		await user.type(screen.getAllByPlaceholderText("••••••••")[0], "1234567");
		await user.press(screen.getByRole("button", { name: "Criar Conta" }));

		expect(
			await screen.findByText("A senha precisa ter no mínimo 8 caracteres."),
		).toBeOnTheScreen();
	});

	it("exibe erro quando as senhas não coincidem", async () => {
		const user = userEvent.setup();
		await render(<SignUpScreen />);

		const [passwordInput, confirmInput] =
			screen.getAllByPlaceholderText("••••••••");

		await user.type(
			screen.getByPlaceholderText("seu@email.com"),
			"user@example.com",
		);
		await user.type(passwordInput, "senha1234");
		await user.type(confirmInput, "outrasenha");
		await user.press(screen.getByRole("button", { name: "Criar Conta" }));

		expect(
			await screen.findByText("As senhas não coincidem."),
		).toBeOnTheScreen();
	});

	it("chama signUp com os dados corretos ao submeter form válido", async () => {
		const user = userEvent.setup();
		await render(<SignUpScreen />);

		const [passwordInput, confirmInput] =
			screen.getAllByPlaceholderText("••••••••");

		await user.type(
			screen.getByPlaceholderText("seu@email.com"),
			"user@example.com",
		);
		await user.type(passwordInput, "senha1234");
		await user.type(confirmInput, "senha1234");
		await user.press(screen.getByRole("button", { name: "Criar Conta" }));

		expect(mockSignUp).toHaveBeenCalledWith({
			email: "user@example.com",
			password: "senha1234",
			confirm_password: "senha1234",
		});
	});

	it("desabilita o botão e exibe spinner quando isLoading é true", async () => {
		setupAuthMock({ isLoading: true });
		await render(<SignUpScreen />);

		// Quando isLoading=true, o nome acessível do botão inclui "loading" do spinner
		expect(screen.getByRole("button", { name: /Criar Conta/i })).toBeDisabled();
		expect(screen.getByLabelText("loading")).toBeOnTheScreen();
	});

	it("alterna a visibilidade de senha e confirmar senha de forma independente", async () => {
		await render(<SignUpScreen />);

		const [passwordInput, confirmInput] =
			screen.getAllByPlaceholderText("••••••••");

		expect(passwordInput).toHaveProp("secureTextEntry", true);
		expect(confirmInput).toHaveProp("secureTextEntry", true);

		// InputSlot é accessibilityElementsHidden, requer includeHiddenElements
		await fireEvent.press(
			screen.getByTestId("toggle-password", { includeHiddenElements: true }),
		);
		expect(passwordInput).toHaveProp("secureTextEntry", false);
		expect(confirmInput).toHaveProp("secureTextEntry", true);

		await fireEvent.press(
			screen.getByTestId("toggle-confirm-password", {
				includeHiddenElements: true,
			}),
		);
		expect(passwordInput).toHaveProp("secureTextEntry", false);
		expect(confirmInput).toHaveProp("secureTextEntry", false);
	});
});
