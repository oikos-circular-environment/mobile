import { render, screen, userEvent } from "@testing-library/react-native";
import { Linking } from "react-native";
import SurveyLocationDeniedScreen from "@/app/survey/location-denied";

const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
	useRouter: () => ({ replace: mockReplace }),
}));

describe("SurveyLocationDeniedScreen", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		mockReplace.mockClear();
		jest
			.spyOn(Linking, "openSettings")
			.mockImplementation(() => Promise.resolve());
	});

	afterEach(() => {
		jest.useRealTimers();
		jest.restoreAllMocks();
	});

	it("explica que sem localização não dá para continuar e que nenhum registro foi criado", async () => {
		await render(<SurveyLocationDeniedScreen />);

		expect(screen.getByText(/não é possível continuar/i)).toBeOnTheScreen();
		expect(screen.getByText(/nenhum registro foi criado/i)).toBeOnTheScreen();
	});

	it("abre as configurações do aparelho", async () => {
		const user = userEvent.setup();
		await render(<SurveyLocationDeniedScreen />);

		await user.press(screen.getByText("Abrir configurações"));

		expect(Linking.openSettings).toHaveBeenCalled();
	});

	it("voltar leva para a home", async () => {
		const user = userEvent.setup();
		await render(<SurveyLocationDeniedScreen />);

		await user.press(screen.getByText("Voltar à tela inicial"));

		expect(mockReplace).toHaveBeenCalledWith("/(tabs)/(home)");
	});
});
