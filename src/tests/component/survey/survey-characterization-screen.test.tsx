import { act, render, screen, userEvent } from "@testing-library/react-native";
import { BackHandler } from "react-native";
import SurveyCharacterizationScreen from "@/app/survey/characterization";
import {
	useSurveyCities,
	useSurveyStates,
} from "@/components/survey/hooks/use-survey-location-catalog";
import { useSurveyProtocol } from "@/components/survey/hooks/use-survey-protocol";
import { useSurveyDraftStore } from "@/stores/survey-draft-store";
import { useSurveyStore } from "@/stores/survey-store";

const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockCreateSurveySession = jest.fn().mockResolvedValue("session-1");

jest.mock("expo-router", () => ({
	useRouter: () => ({ replace: mockReplace, back: mockBack }),
}));

jest.mock("@/components/survey/hooks/use-survey-protocol");
jest.mock("@/components/survey/hooks/use-survey-location-catalog");
jest.mock("@/libs/survey/create-session", () => ({
	createSurveySession: (...args: unknown[]) => mockCreateSurveySession(...args),
}));

const protocolFixture = {
	key: "oikos-walkthrough",
	version: 1,
	personas: [],
	suites: [],
	tasks: [],
	questions: [
		{
			key: "age_range",
			scope: "SCREENER",
			type: "CHOICE",
			position: 0,
			label: "Qual a sua faixa de idade?",
			required: true,
			options: [
				{ value: 1, key: "UNDER_18", label: "Menos de 18 anos" },
				{ value: 2, key: "AGE_18_24", label: "18 a 24 anos" },
			],
		},
		{
			key: "app_experience",
			scope: "SCREENER",
			type: "SCALE",
			position: 1,
			label: "Qual a sua experiência com aplicativos?",
			required: true,
			options: [
				{ value: 1, key: "NONE", label: "Nenhuma" },
				{ value: 5, key: "VERY_ADVANCED", label: "Muito avançada" },
			],
		},
	],
};

function setDraft(
	overrides: Partial<ReturnType<typeof useSurveyDraftStore.getState>>,
) {
	useSurveyDraftStore.setState(overrides);
}

describe("SurveyCharacterizationScreen", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		mockReplace.mockClear();
		mockBack.mockClear();
		mockCreateSurveySession.mockClear();
		useSurveyDraftStore.getState().reset();
		useSurveyStore.getState().reset();
		jest.mocked(useSurveyProtocol).mockReturnValue({
			data: protocolFixture,
		} as never);
		jest.mocked(useSurveyStates).mockReturnValue({
			data: [],
			isLoading: false,
		} as never);
		jest.mocked(useSurveyCities).mockReturnValue({
			data: [],
			isLoading: false,
		} as never);
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("exibe a primeira pergunta SCREENER e avança para a próxima ao selecionar e continuar", async () => {
		const user = userEvent.setup();
		await render(<SurveyCharacterizationScreen />);

		expect(screen.getByText("Qual a sua faixa de idade?")).toBeOnTheScreen();
		expect(screen.getByText("Continuar").parent).toBeDisabled();

		await user.press(screen.getByText("18 a 24 anos"));
		await user.press(screen.getByText("Continuar"));

		expect(useSurveyDraftStore.getState().ageRange).toBe("AGE_18_24");
		expect(
			screen.getByText("Qual a sua experiência com aplicativos?"),
		).toBeOnTheScreen();
	});

	it("na última pergunta, cria a sessão e navega para a abertura da primeira etapa", async () => {
		const user = userEvent.setup();
		setDraft({
			persona: "CITIZEN",
			stateUf: "SP",
			cityName: "São Paulo",
			ageRange: "AGE_18_24",
			educationLevel: "HIGHSCHOOL_COMPLETE",
			chainRole: "NONE",
			wasteContactFrequency: 3,
		});
		useSurveyStore
			.getState()
			.setConsent("2026-07-30", "2026-07-30T10:00:00.000Z");
		await render(<SurveyCharacterizationScreen />);

		await user.press(screen.getByText("18 a 24 anos"));
		await user.press(screen.getByText("Continuar"));
		await user.press(screen.getByText("Muito avançada"));
		await user.press(screen.getByText("Continuar"));

		expect(mockCreateSurveySession).toHaveBeenCalledTimes(1);
		expect(mockReplace).toHaveBeenCalledWith("/survey/suite-intro");
		expect(useSurveyStore.getState().sessionId).toBe("session-1");
		expect(useSurveyDraftStore.getState().persona).toBeNull();
	});

	it("o botão de voltar retorna pra pergunta anterior, sem resetar pra primeira", async () => {
		const user = userEvent.setup();
		await render(<SurveyCharacterizationScreen />);

		await user.press(screen.getByText("18 a 24 anos"));
		await user.press(screen.getByText("Continuar"));
		expect(
			screen.getByText("Qual a sua experiência com aplicativos?"),
		).toBeOnTheScreen();

		await user.press(screen.getByLabelText("Voltar"));

		expect(screen.getByText("Qual a sua faixa de idade?")).toBeOnTheScreen();
		expect(mockBack).not.toHaveBeenCalled();
	});

	it("voltar na primeira pergunta sai da tela em vez de ficar preso nela", async () => {
		const user = userEvent.setup();
		await render(<SurveyCharacterizationScreen />);

		await user.press(screen.getByLabelText("Voltar"));

		expect(mockBack).toHaveBeenCalledTimes(1);
	});

	it("o botão físico de voltar (Android) segue a mesma regra do botão de voltar", async () => {
		const addEventListener = jest.spyOn(BackHandler, "addEventListener");
		const user = userEvent.setup();
		await render(<SurveyCharacterizationScreen />);

		await user.press(screen.getByText("18 a 24 anos"));
		await user.press(screen.getByText("Continuar"));

		const hardwareBackHandler = addEventListener.mock.calls.find(
			([eventName]) => eventName === "hardwareBackPress",
		)?.[1] as () => boolean;

		await act(async () => {
			hardwareBackHandler();
			await Promise.resolve();
		});

		expect(screen.getByText("Qual a sua faixa de idade?")).toBeOnTheScreen();
		expect(mockBack).not.toHaveBeenCalled();

		await act(async () => {
			hardwareBackHandler();
			await Promise.resolve();
		});
		expect(mockBack).toHaveBeenCalledTimes(1);

		addEventListener.mockRestore();
	});
});
