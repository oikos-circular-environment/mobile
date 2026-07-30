import { render, screen, userEvent } from "@testing-library/react-native";
import SurveyLocationScreen from "@/app/survey/location";
import { useSurveyLocationPermission } from "@/components/survey/hooks/use-survey-location-permission";

const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
	useRouter: () => ({ replace: mockReplace }),
}));

jest.mock("@/components/survey/hooks/use-survey-location-permission");

describe("SurveyLocationScreen", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		mockReplace.mockClear();
	});

	afterEach(() => {
		jest.useRealTimers();
		jest.clearAllMocks();
	});

	it("explica por que a localização é necessária antes de qualquer termo", async () => {
		jest.mocked(useSurveyLocationPermission).mockReturnValue({
			status: "idle",
			request: jest.fn(),
		});

		await render(<SurveyLocationScreen />);

		expect(
			screen.getByText(/precisamos da sua localização/i),
		).toBeOnTheScreen();
	});

	it("ao conceder, navega para o consentimento", async () => {
		const request = jest.fn().mockResolvedValue(true);
		jest
			.mocked(useSurveyLocationPermission)
			.mockReturnValue({ status: "idle", request });
		const user = userEvent.setup();

		await render(<SurveyLocationScreen />);
		await user.press(screen.getByText("Permitir localização"));

		expect(mockReplace).toHaveBeenCalledWith("/survey/consent");
	});

	it("ao negar, navega para a tela de recusa", async () => {
		const request = jest.fn().mockResolvedValue(false);
		jest
			.mocked(useSurveyLocationPermission)
			.mockReturnValue({ status: "idle", request });
		const user = userEvent.setup();

		await render(<SurveyLocationScreen />);
		await user.press(screen.getByText("Permitir localização"));

		expect(mockReplace).toHaveBeenCalledWith("/survey/location-denied");
	});
});
