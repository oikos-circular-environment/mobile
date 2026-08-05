import { render, screen, userEvent } from "@testing-library/react-native";
import SurveyPresentationScreen from "@/app/survey/index";
import { useGeospatial } from "@/contexts/geospatial-context";

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock("expo-router", () => ({
	useRouter: () => ({ push: mockPush, back: mockBack }),
}));

jest.mock("@/contexts/geospatial-context");

function mockGeospatial(permissionDenied: boolean) {
	jest.mocked(useGeospatial).mockReturnValue({
		heading: null,
		location: null,
		addresses: [],
		permissionDenied,
		isResolving: false,
		reverseGeocodeError: false,
	});
}

describe("SurveyPresentationScreen", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		mockPush.mockClear();
		mockBack.mockClear();
		mockGeospatial(false);
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

	it("ao continuar com localização já concedida, vai direto para o consentimento", async () => {
		const user = userEvent.setup();
		mockGeospatial(false);
		await render(<SurveyPresentationScreen />);

		await user.press(screen.getByText("Continuar"));

		expect(mockPush).toHaveBeenCalledWith("/survey/consent");
	});

	it("ao continuar sem localização concedida, vai para a tela de localização negada", async () => {
		const user = userEvent.setup();
		mockGeospatial(true);
		await render(<SurveyPresentationScreen />);

		await user.press(screen.getByText("Continuar"));

		expect(mockPush).toHaveBeenCalledWith("/survey/location-denied");
	});

	it("agora não volta para a tela anterior", async () => {
		const user = userEvent.setup();
		await render(<SurveyPresentationScreen />);

		await user.press(screen.getByText("Agora não"));

		expect(mockBack).toHaveBeenCalled();
	});
});
