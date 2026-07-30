import { render, screen, userEvent } from "@testing-library/react-native";
import SurveyResumeScreen from "@/app/survey/resume";
import { useSurveyProtocol } from "@/components/survey/hooks/use-survey-protocol";
import { surveySession } from "@/libs/survey/db/schema";
import { createTestSurveyDb } from "@/libs/survey/db/test-client";
import { useSurveyExecutionStore } from "@/stores/survey-execution-store";
import { useSurveyStore } from "@/stores/survey-store";

const mockBack = jest.fn();
const mockDismissTo = jest.fn();
const mockReplace = jest.fn();
const mockDb = createTestSurveyDb();

jest.mock("expo-router", () => ({
	useRouter: () => ({
		back: mockBack,
		dismissTo: mockDismissTo,
		replace: mockReplace,
	}),
}));

jest.mock("@/libs/survey/db/client", () => ({
	getSurveyDb: () => mockDb,
}));

jest.mock("@/libs/survey/queue/outbox", () => ({
	enqueueAbandon: jest.fn().mockResolvedValue(undefined),
	drainOutbox: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/components/survey/hooks/use-survey-protocol");

const protocolFixture = {
	key: "oikos-walkthrough",
	version: 1,
	personas: [
		{ key: "CITIZEN", label: "Cidadão", description: "d", suite_codes: [] },
	],
	suites: [
		{ code: "S1", title: "Exploração livre", objective: "o", task_codes: [] },
		{ code: "S2", title: "Registro e perfil", objective: "o", task_codes: [] },
	],
	tasks: [],
	questions: [],
};

describe("SurveyResumeScreen", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		mockBack.mockClear();
		mockDismissTo.mockClear();
		mockReplace.mockClear();
		mockDb.delete(surveySession).run();
		useSurveyExecutionStore.getState().reset();
		useSurveyStore.getState().reset();
		useSurveyStore.getState().startSession("session-1", "CITIZEN");
		useSurveyExecutionStore.getState().initRoteiro(["S1", "S2"]);
		jest.mocked(useSurveyProtocol).mockReturnValue({
			data: protocolFixture,
		} as never);
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("mostra a etapa em andamento e as pendentes", async () => {
		useSurveyExecutionStore.getState().openSuiteIntro({
			code: "S1",
			title: "S1",
			objective: "o",
			tasks: [],
		});
		useSurveyExecutionStore.getState().beginSuite();

		await render(<SurveyResumeScreen />);

		expect(screen.getByText("S1 · Exploração livre")).toBeOnTheScreen();
		expect(screen.getByText("Em andamento")).toBeOnTheScreen();
		expect(screen.getByText("S2 · Registro e perfil")).toBeOnTheScreen();
		expect(screen.getAllByText("Pendente").length).toBeGreaterThan(0);
	});

	it("Continuar despausa e fecha de volta para o app quando a etapa está ativa", async () => {
		const user = userEvent.setup();
		useSurveyExecutionStore.getState().openSuiteIntro({
			code: "S1",
			title: "S1",
			objective: "o",
			tasks: [],
		});
		useSurveyExecutionStore.getState().beginSuite();
		useSurveyExecutionStore.getState().setPaused(true);

		await render(<SurveyResumeScreen />);
		await user.press(screen.getByText("Continuar"));

		expect(useSurveyExecutionStore.getState().isPaused).toBe(false);
		expect(mockDismissTo).toHaveBeenCalledWith("/(tabs)/(home)");
	});

	it("abre o sheet de excluir dados a partir da zona perigosa", async () => {
		const user = userEvent.setup();
		await render(<SurveyResumeScreen />);

		await user.press(screen.getByText("Solicitar exclusão dos meus dados"));

		expect(
			screen.getByText("Excluir meus dados da pesquisa?"),
		).toBeOnTheScreen();
	});

	it("abre o sheet de abandonar a partir da zona perigosa", async () => {
		const user = userEvent.setup();
		await render(<SurveyResumeScreen />);

		await user.press(screen.getByText("Abandonar a pesquisa"));

		expect(screen.getByText("Abandonar a pesquisa?")).toBeOnTheScreen();
	});
});
