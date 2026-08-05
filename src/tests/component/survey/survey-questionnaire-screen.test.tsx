import { render, screen, userEvent } from "@testing-library/react-native";
import SurveyQuestionnaireScreen from "@/app/survey/questionnaire";
import { useSurveyProtocol } from "@/components/survey/hooks/use-survey-protocol";
import { surveySession, surveySuiteRun } from "@/libs/survey/db/schema";
import { createTestSurveyDb } from "@/libs/survey/db/test-client";
import { useSurveyExecutionStore } from "@/stores/survey-execution-store";
import { useSurveyStore } from "@/stores/survey-store";

const mockReplace = jest.fn();
const mockDismissTo = jest.fn();
const mockDb = createTestSurveyDb();
const mockEnqueueCheckpoint = jest.fn().mockResolvedValue(undefined);
const mockDrainOutbox = jest.fn().mockResolvedValue(undefined);

jest.mock("expo-router", () => ({
	useRouter: () => ({ replace: mockReplace, dismissTo: mockDismissTo }),
}));

jest.mock("@/libs/survey/db/client", () => ({
	getSurveyDb: () => mockDb,
}));

jest.mock("@/libs/survey/queue/outbox", () => ({
	enqueueCheckpoint: (...args: unknown[]) => mockEnqueueCheckpoint(...args),
	drainOutbox: (...args: unknown[]) => mockDrainOutbox(...args),
}));

jest.mock("@/components/survey/hooks/use-survey-protocol");

const agreementOptions = [
	{ value: 1, key: "STRONGLY_DISAGREE", label: "Discordo totalmente" },
	{ value: 3, key: "NEUTRAL", label: "Nem concordo nem discordo" },
	{ value: 5, key: "STRONGLY_AGREE", label: "Concordo totalmente" },
];

const protocolFixture = {
	key: "oikos-walkthrough",
	version: 1,
	personas: [],
	suites: [],
	tasks: [],
	questions: [
		{
			key: "satisfaction",
			scope: "PER_SUITE",
			type: "SCALE",
			position: 1,
			label: "Como você avalia sua satisfação com esta etapa?",
			info_text: "Pense em como foi usar o aplicativo.",
			options: [
				{ value: 4, key: "GOOD", label: "Bom" },
				{ value: 5, key: "EXCELLENT", label: "Ótimo" },
			],
		},
		{
			key: "error_occurred",
			scope: "PER_SUITE",
			type: "CHOICE",
			position: 8,
			label: "Aconteceu algum erro nesta etapa?",
			options: [
				{ value: 1, key: "YES", label: "Sim" },
				{ value: 2, key: "NO", label: "Não" },
			],
		},
		{
			key: "error_recovery",
			scope: "PER_SUITE",
			type: "SCALE",
			position: 9,
			label: "A mensagem me ajudou a entender o problema.",
			options: agreementOptions,
		},
	],
};

function setupSuite() {
	useSurveyExecutionStore.getState().reset();
	useSurveyExecutionStore.getState().initRoteiro(["S1", "S2"]);
	useSurveyExecutionStore.getState().openSuiteIntro({
		code: "S1",
		title: "S1",
		objective: "obj",
		tasks: [{ code: "T8", title: "a", instruction: "a" }],
	});
	useSurveyExecutionStore.getState().setSuiteRunId("suite-run-1");
	useSurveyExecutionStore.getState().beginSuite();
	useSurveyExecutionStore.getState().completeCurrentTask();
	useSurveyStore.getState().reset();
	useSurveyStore.getState().startSession("session-1", "CITIZEN");

	mockDb.delete(surveySuiteRun).run();
	mockDb.delete(surveySession).run();

	const now = "2026-07-30T10:00:00.000Z";
	mockDb
		.insert(surveySession)
		.values({
			id: "session-1",
			protocolKey: "oikos-walkthrough",
			protocolVersion: 1,
			persona: "CITIZEN",
			stateUf: "SP",
			cityName: "São Paulo",
			ageRange: "AGE_18_24",
			educationLevel: "HIGHSCHOOL_COMPLETE",
			chainRole: "NONE",
			wasteContactFrequency: 3,
			appExperience: 3,
			consentVersion: "2026-07-30",
			consentAt: now,
			deviceOs: "ios",
			deviceOsVersion: "18",
			appVersion: "1.0.0",
			screenSize: "MEDIUM",
			startedAt: now,
			createdAt: now,
			updatedAt: now,
		})
		.run();
	mockDb
		.insert(surveySuiteRun)
		.values({
			id: "suite-run-1",
			sessionId: "session-1",
			suiteCode: "S1",
			position: 0,
			startedAt: now,
		})
		.run();
}

describe("SurveyQuestionnaireScreen", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		mockReplace.mockClear();
		mockDismissTo.mockClear();
		mockEnqueueCheckpoint.mockClear();
		mockDrainOutbox.mockClear();
		jest.mocked(useSurveyProtocol).mockReturnValue({
			data: protocolFixture,
		} as never);
		setupSuite();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("exibe a primeira pergunta com o InfoExpand e mantém Próxima desabilitada sem seleção", async () => {
		await render(<SurveyQuestionnaireScreen />);

		expect(
			screen.getByText("Como você avalia sua satisfação com esta etapa?"),
		).toBeOnTheScreen();
		expect(screen.getByText("Próxima").parent).toBeDisabled();
	});

	it("Não em error_occurred não revela o item condicional e envia sem error_recovery", async () => {
		const user = userEvent.setup();
		await render(<SurveyQuestionnaireScreen />);

		await user.press(screen.getByText("Ótimo"));
		await user.press(screen.getByText("Próxima"));

		await user.press(screen.getByText("Não"));
		expect(
			screen.queryByText("A mensagem me ajudou a entender o problema."),
		).not.toBeOnTheScreen();

		await user.press(screen.getByText("Próxima"));

		expect(mockEnqueueCheckpoint).toHaveBeenCalledTimes(1);
		const payload = mockEnqueueCheckpoint.mock.calls[0][1];
		const errorAnswer = payload.answers.find(
			(a: { question_key: string }) => a.question_key === "error_occurred",
		);
		expect(errorAnswer.valueText).toBe("NO");
		expect(
			payload.answers.some(
				(a: { question_key: string }) => a.question_key === "error_recovery",
			),
		).toBe(false);
		expect(screen.getByText("Etapa concluída!")).toBeOnTheScreen();
	});

	it("Sim revela error_recovery inline, sem salto de tela, e descarta a resposta se voltar para Não", async () => {
		const user = userEvent.setup();
		await render(<SurveyQuestionnaireScreen />);

		await user.press(screen.getByText("Ótimo"));
		await user.press(screen.getByText("Próxima"));

		await user.press(screen.getByText("Sim"));
		expect(
			screen.getByText("A mensagem me ajudou a entender o problema."),
		).toBeOnTheScreen();
		expect(screen.getByText("Próxima").parent).toBeDisabled();

		await user.press(screen.getByText("Concordo totalmente"));
		expect(screen.getByText("Próxima").parent).not.toBeDisabled();

		await user.press(screen.getByText("Não"));
		expect(
			screen.queryByText("A mensagem me ajudou a entender o problema."),
		).not.toBeOnTheScreen();
	});

	it("continuar depois volta para a home preservando o progresso salvo", async () => {
		const user = userEvent.setup();
		await render(<SurveyQuestionnaireScreen />);

		await user.press(screen.getByText("Bom"));
		await user.press(screen.getByText("Próxima"));
		await user.press(screen.getByText("Não"));
		await user.press(screen.getByText("Próxima"));

		await user.press(screen.getByText("Continuar depois"));

		expect(mockDismissTo).toHaveBeenCalledWith("/(tabs)/(home)");
	});
});
