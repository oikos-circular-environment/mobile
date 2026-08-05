import { render, screen } from "@testing-library/react-native";
import { SlideToLoginButton } from "@/components/home/slide-to-login-button";

jest.mock("expo-router", () => ({
	useFocusEffect: (effect: () => void) => effect(),
}));

describe("SlideToLoginButton — componente", () => {
	it("mostra o rótulo de iniciar sessão", async () => {
		await render(<SlideToLoginButton onComplete={jest.fn()} />);

		expect(screen.getByText("Iniciar sessão")).toBeOnTheScreen();
	});

	it("aceita um rótulo customizado", async () => {
		await render(
			<SlideToLoginButton
				label="Arraste para continuar"
				onComplete={jest.fn()}
			/>,
		);

		expect(screen.getByText("Arraste para continuar")).toBeOnTheScreen();
	});
});
