import { render, screen, userEvent } from "@testing-library/react-native";
import SurveyConsentScreen from "@/app/survey/consent";
import { useAuthContext } from "@/contexts/auth-context";
import { useSurveyStore } from "@/stores/survey-store";

const mockReplace = jest.fn();
const mockSignOut = jest.fn();

jest.mock("expo-router", () => ({
	useRouter: () => ({ replace: mockReplace }),
}));

jest.mock("@/contexts/auth-context");

async function scrollToEnd(user: ReturnType<typeof userEvent.setup>) {
	await user.scrollTo(screen.getByTestId("survey-consent-scroll"), {
		y: 500,
		contentSize: { height: 520, width: 400 },
		layoutMeasurement: { height: 400, width: 400 },
	});
}

describe("SurveyConsentScreen", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		mockReplace.mockClear();
		mockSignOut.mockClear();
		useSurveyStore.getState().reset();
		jest.mocked(useAuthContext).mockReturnValue({
			isAuthenticated: false,
			signOut: mockSignOut,
		} as never);
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("o botão de aceitar começa desabilitado", async () => {
		await render(<SurveyConsentScreen />);

		expect(screen.getByText("Li e aceito").parent).toBeDisabled();
	});

	it("destrava o aceite ao chegar ao fim da rolagem, registra o consentimento e encerra a sessão da conta", async () => {
		const user = userEvent.setup();
		jest.mocked(useAuthContext).mockReturnValue({
			isAuthenticated: true,
			signOut: mockSignOut,
		} as never);
		await render(<SurveyConsentScreen />);

		await scrollToEnd(user);
		await user.press(screen.getByText("Li e aceito"));

		expect(mockSignOut).toHaveBeenCalledTimes(1);
		expect(useSurveyStore.getState().consentVersion).not.toBeNull();
		expect(useSurveyStore.getState().consentAt).not.toBeNull();
		expect(mockReplace).toHaveBeenCalledWith("/survey/consent-ended");
	});

	it("recusar volta para a home sem registrar nada", async () => {
		const user = userEvent.setup();
		await render(<SurveyConsentScreen />);

		await user.press(screen.getByText("Recusar"));

		expect(mockReplace).toHaveBeenCalledWith("/(tabs)/(home)");
		expect(useSurveyStore.getState().consentVersion).toBeNull();
		expect(mockSignOut).not.toHaveBeenCalled();
	});
});
