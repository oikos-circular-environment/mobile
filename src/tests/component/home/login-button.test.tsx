import { render, screen, userEvent } from "@testing-library/react-native";
import { LoginButton } from "@/components/home/login-button";

describe("LoginButton — componente", () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("mostra o rótulo padrão de iniciar sessão", async () => {
		await render(<LoginButton onPress={jest.fn()} />);

		expect(screen.getByText("Iniciar sessão")).toBeOnTheScreen();
	});

	it("aceita um rótulo customizado", async () => {
		await render(<LoginButton label="Entrar agora" onPress={jest.fn()} />);

		expect(screen.getByText("Entrar agora")).toBeOnTheScreen();
	});

	it("dispara onPress ao tocar no botão", async () => {
		const user = userEvent.setup();
		const onPress = jest.fn();
		await render(<LoginButton onPress={onPress} />);

		await user.press(screen.getByText("Iniciar sessão"));

		expect(onPress).toHaveBeenCalledTimes(1);
	});
});
