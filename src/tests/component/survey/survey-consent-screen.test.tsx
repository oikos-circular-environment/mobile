import {
	render,
	screen,
	userEvent,
	waitFor,
} from "@testing-library/react-native";
import SurveyConsentScreen from "@/app/survey/consent";
import { toast } from "@/components/toast";
import { useAuthContext } from "@/contexts/auth-context";
import { useGeospatial } from "@/contexts/geospatial-context";
import { provisionSyntheticParticipant } from "@/libs/survey/synthetic-participant";
import { useSurveyStore } from "@/stores/survey-store";

const mockReplace = jest.fn();
const mockSignOut = jest.fn();
const mockRefreshSession = jest.fn();

jest.mock("expo-router", () => ({
	useRouter: () => ({ replace: mockReplace }),
}));

jest.mock("@/contexts/auth-context");
jest.mock("@/contexts/geospatial-context");

jest.mock("@/libs/survey/synthetic-participant", () => ({
	provisionSyntheticParticipant: jest.fn(),
}));

jest.mock("@/components/toast", () => ({
	toast: {
		success: jest.fn(),
		error: jest.fn(),
		info: jest.fn(),
		warning: jest.fn(),
		close: jest.fn(),
		closeAll: jest.fn(),
	},
	Toaster: () => null,
}));

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
		mockRefreshSession.mockClear();
		mockSignOut.mockResolvedValue(undefined);
		mockRefreshSession.mockResolvedValue(undefined);
		jest.mocked(provisionSyntheticParticipant).mockReset();
		jest.mocked(provisionSyntheticParticipant).mockResolvedValue(undefined);
		jest.mocked(toast.error).mockClear();
		useSurveyStore.getState().reset();
		jest.mocked(useAuthContext).mockReturnValue({
			isAuthenticated: false,
			signOut: mockSignOut,
			refreshSession: mockRefreshSession,
		} as never);
		jest.mocked(useGeospatial).mockReturnValue({
			location: null,
			addresses: [],
		} as never);
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("o botão de aceitar começa desabilitado", async () => {
		await render(<SurveyConsentScreen />);

		expect(screen.getByText("Li e aceito").parent).toBeDisabled();
	});

	it("destrava o aceite ao chegar ao fim da rolagem, encerra a sessão em silêncio, provisiona o participante sintético e navega para consent-ended", async () => {
		const user = userEvent.setup();
		jest.mocked(useAuthContext).mockReturnValue({
			isAuthenticated: true,
			signOut: mockSignOut,
			refreshSession: mockRefreshSession,
		} as never);
		await render(<SurveyConsentScreen />);

		await scrollToEnd(user);
		await user.press(screen.getByText("Li e aceito"));

		await waitFor(() => {
			expect(mockReplace).toHaveBeenCalledWith("/survey/consent-ended");
		});

		expect(mockSignOut).toHaveBeenCalledWith({ silent: true });
		expect(provisionSyntheticParticipant).toHaveBeenCalledTimes(1);
		expect(mockRefreshSession).toHaveBeenCalledTimes(1);
		expect(useSurveyStore.getState().consentVersion).not.toBeNull();
		expect(useSurveyStore.getState().consentAt).not.toBeNull();
	});

	it("deslogado, aceitar provisiona o participante sintético e vai direto pro persona sem tela de sessão encerrada", async () => {
		const user = userEvent.setup();
		await render(<SurveyConsentScreen />);

		await scrollToEnd(user);
		await user.press(screen.getByText("Li e aceito"));

		await waitFor(() => {
			expect(mockReplace).toHaveBeenCalledWith("/survey/persona");
		});

		expect(mockSignOut).not.toHaveBeenCalled();
		expect(provisionSyntheticParticipant).toHaveBeenCalledTimes(1);
		expect(mockRefreshSession).toHaveBeenCalledTimes(1);
		expect(useSurveyStore.getState().consentVersion).not.toBeNull();
	});

	it("passa a localização atual pro provisionamento sintético quando disponível", async () => {
		jest.mocked(useGeospatial).mockReturnValue({
			location: { coords: { latitude: -23.55, longitude: -46.63 } },
			addresses: [{ postalCode: "01310-100", streetNumber: "1000" }],
		} as never);
		const user = userEvent.setup();
		await render(<SurveyConsentScreen />);

		await scrollToEnd(user);
		await user.press(screen.getByText("Li e aceito"));

		await waitFor(() => {
			expect(provisionSyntheticParticipant).toHaveBeenCalledWith({
				latitude: -23.55,
				longitude: -46.63,
				postalCode: "01310-100",
				streetNumber: "1000",
			});
		});
	});

	it("erro ao provisionar o participante sintético mostra toast e mantém o participante na tela", async () => {
		jest
			.mocked(provisionSyntheticParticipant)
			.mockRejectedValueOnce(new Error("network down"));
		const user = userEvent.setup();
		await render(<SurveyConsentScreen />);

		await scrollToEnd(user);
		await user.press(screen.getByText("Li e aceito"));

		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith(
				"Não foi possível iniciar a pesquisa",
				"Tente novamente em instantes.",
			);
		});

		expect(mockReplace).not.toHaveBeenCalled();
		expect(mockRefreshSession).not.toHaveBeenCalled();
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
