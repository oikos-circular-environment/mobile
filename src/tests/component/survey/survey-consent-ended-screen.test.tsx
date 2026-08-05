import { render, screen, userEvent } from "@testing-library/react-native";
import SurveyConsentEndedScreen from "@/app/survey/consent-ended";

const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
	useRouter: () => ({ replace: mockReplace }),
}));

describe("SurveyConsentEndedScreen", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		mockReplace.mockClear();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("explica que a sessão da conta atual foi encerrada", async () => {
		await render(<SurveyConsentEndedScreen />);

		expect(screen.getByText("Sua sessão foi encerrada")).toBeOnTheScreen();
	});

	it("continuar navega para a escolha de persona", async () => {
		const user = userEvent.setup();
		await render(<SurveyConsentEndedScreen />);

		await user.press(screen.getByText("Continuar"));

		expect(mockReplace).toHaveBeenCalledWith("/survey/persona");
	});
});
