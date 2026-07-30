import { render, screen, userEvent } from "@testing-library/react-native";
import SurveyPresentationScreen from "@/app/survey/index";

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock("expo-router", () => ({
	useRouter: () => ({ push: mockPush, back: mockBack }),
}));

describe("SurveyPresentationScreen", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		mockPush.mockClear();
		mockBack.mockClear();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("avisa que participar encerra a sessão da conta atual", async () => {
		await render(<SurveyPresentationScreen />);

		expect(
			screen.getByText(/participar encerra a sessão da conta atual/i),
		).toBeOnTheScreen();
	});

	it("ao continuar, navega para o pedido de localização", async () => {
		const user = userEvent.setup();
		await render(<SurveyPresentationScreen />);

		await user.press(screen.getByText("Continuar"));

		expect(mockPush).toHaveBeenCalledWith("/survey/location");
	});

	it("agora não volta para a tela anterior", async () => {
		const user = userEvent.setup();
		await render(<SurveyPresentationScreen />);

		await user.press(screen.getByText("Agora não"));

		expect(mockBack).toHaveBeenCalled();
	});
});
