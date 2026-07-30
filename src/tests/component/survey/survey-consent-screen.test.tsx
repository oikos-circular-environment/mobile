import { render, screen, userEvent } from "@testing-library/react-native";
import SurveyConsentPlaceholderScreen from "@/app/survey/consent";

const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
	useRouter: () => ({ replace: mockReplace }),
}));

describe("SurveyConsentPlaceholderScreen", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		mockReplace.mockClear();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("volta para a home", async () => {
		const user = userEvent.setup();
		await render(<SurveyConsentPlaceholderScreen />);

		await user.press(screen.getByText("Voltar para a home"));

		expect(mockReplace).toHaveBeenCalledWith("/(tabs)/(home)");
	});
});
