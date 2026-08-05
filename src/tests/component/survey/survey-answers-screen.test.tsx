import { render, screen } from "@testing-library/react-native";
import SurveyAnswersScreen from "@/app/survey/answers";
import { useSurveyProtocol } from "@/components/survey/hooks/use-survey-protocol";
import {
	surveyAnswer,
	surveySession,
	surveySuiteRun,
} from "@/libs/survey/db/schema";
import { createTestSurveyDb } from "@/libs/survey/db/test-client";
import { useSurveyStore } from "@/stores/survey-store";

const mockBack = jest.fn();
const mockDb = createTestSurveyDb();

jest.mock("expo-router", () => ({
	useRouter: () => ({ back: mockBack }),
	useLocalSearchParams: () => ({ suiteCode: "S1" }),
}));

jest.mock("@/libs/survey/db/client", () => ({
	getSurveyDb: () => mockDb,
}));

jest.mock("@/components/survey/hooks/use-survey-protocol");

const protocolFixture = {
	key: "oikos-walkthrough",
	version: 1,
	personas: [],
	suites: [
		{ code: "S1", title: "Exploração livre", objective: "o", task_codes: [] },
	],
	tasks: [],
	questions: [
		{
			key: "satisfaction",
			scope: "PER_SUITE",
			type: "SCALE",
			position: 1,
			label: "Como você avalia sua satisfação com esta etapa?",
			options: [
				{ value: 4, key: "GOOD", label: "Bom" },
				{ value: 5, key: "EXCELLENT", label: "Ótimo" },
			],
		},
	],
};

describe("SurveyAnswersScreen", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		mockBack.mockClear();
		mockDb.delete(surveyAnswer).run();
		mockDb.delete(surveySuiteRun).run();
		mockDb.delete(surveySession).run();
		useSurveyStore.getState().reset();
		useSurveyStore.getState().startSession("session-1", "CITIZEN");
		jest.mocked(useSurveyProtocol).mockReturnValue({
			data: protocolFixture,
		} as never);

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
				startedAt: "2026-07-30T14:02:00.000Z",
				finishedAt: "2026-07-30T14:11:00.000Z",
				activeMs: 9 * 60_000,
			})
			.run();
		mockDb
			.insert(surveyAnswer)
			.values({
				id: "answer-1",
				sessionId: "session-1",
				suiteRunId: "suite-run-1",
				questionKey: "satisfaction",
				valueNumber: 4,
			})
			.run();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("mostra a pergunta e a resposta escolhida, sem permitir edição", async () => {
		await render(<SurveyAnswersScreen />);

		expect(
			await screen.findByText(
				"Como você avalia sua satisfação com esta etapa?",
			),
		).toBeOnTheScreen();
		expect(screen.getByText("Bom")).toBeOnTheScreen();
		expect(
			screen.getByText("Essas respostas não podem ser editadas."),
		).toBeOnTheScreen();
	});
});
