import { render, screen, userEvent } from "@testing-library/react-native";
import SurveySuiteIntroScreen from "@/app/survey/suite-intro";
import { useSurveyProtocol } from "@/components/survey/hooks/use-survey-protocol";
import { surveySession } from "@/libs/survey/db/schema";
import { createTestSurveyDb } from "@/libs/survey/db/test-client";
import { useSurveyExecutionStore } from "@/stores/survey-execution-store";
import { useSurveyStore } from "@/stores/survey-store";

const mockDismissTo = jest.fn();
const mockDb = createTestSurveyDb();

jest.mock("expo-router", () => ({
	useRouter: () => ({ dismissTo: mockDismissTo }),
}));

jest.mock("@/libs/survey/db/client", () => ({
	getSurveyDb: () => mockDb,
}));

jest.mock("@/components/survey/hooks/use-survey-protocol");

const protocolFixture = {
	key: "oikos-walkthrough",
	version: 1,
	personas: [
		{
			key: "CITIZEN",
			label: "Cidadão",
			description: "desc",
			suites: [
				{ suite_code: "S1", specific_objectives: ["Objetivo específico."] },
				{ suite_code: "S2", specific_objectives: [] },
			],
		},
	],
	suites: [
		{
			code: "S1",
			title: "Exploração livre",
			objective: "Explore o app livremente.",
			task_codes: ["T8"],
		},
		{
			code: "S2",
			title: "Registro e perfil",
			objective: "obj",
			task_codes: [],
		},
	],
	tasks: [
		{
			code: "T8",
			title: "Buscar pontos de coleta",
			instruction: "Busque pontos de coleta próximos.",
			success: { mode: "any", signals: [] },
		},
	],
	questions: [],
};

describe("SurveySuiteIntroScreen", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		mockDismissTo.mockClear();
		mockDb.delete(surveySession).run();
		useSurveyExecutionStore.getState().reset();
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
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("monta o roteiro da persona e mostra a etapa 1 de N com objetivo", async () => {
		await render(<SurveySuiteIntroScreen />);

		expect(screen.getByText("Etapa 1 de 2")).toBeOnTheScreen();
		expect(screen.getByText("Exploração livre")).toBeOnTheScreen();
		expect(screen.getByText("Explore o app livremente.")).toBeOnTheScreen();
		expect(screen.getByText("Objetivo específico.")).toBeOnTheScreen();
	});

	it("Começar fica desabilitado por 3s e só então ativa a execução", async () => {
		const user = userEvent.setup();
		await render(<SurveySuiteIntroScreen />);

		expect(screen.getByText("Começar (3)")).toBeOnTheScreen();

		await jest.advanceTimersByTimeAsync(1000);
		await jest.advanceTimersByTimeAsync(1000);
		await jest.advanceTimersByTimeAsync(1000);
		await jest.advanceTimersByTimeAsync(0);
		expect(screen.getByText("Começar")).toBeOnTheScreen();

		await user.press(screen.getByText("Começar"));

		expect(useSurveyExecutionStore.getState().isActive).toBe(true);
		expect(mockDismissTo).toHaveBeenCalledWith("/(tabs)/(home)");
	});
});
