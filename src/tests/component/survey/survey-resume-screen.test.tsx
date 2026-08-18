import { render, screen, userEvent } from "@testing-library/react-native";
import SurveyResumeScreen from "@/app/survey/resume";
import { useSurveyProtocol } from "@/components/survey/hooks/use-survey-protocol";
import {
	surveyAnswer,
	surveySession,
	surveySuiteRun,
} from "@/libs/survey/db/schema";
import { createTestSurveyDb } from "@/libs/survey/db/test-client";
import { useSurveyExecutionStore } from "@/stores/survey-execution-store";
import { useSurveyStore } from "@/stores/survey-store";

const mockBack = jest.fn();
const mockDismissTo = jest.fn();
const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockDb = createTestSurveyDb();

async function seedSession(
	overrides: Partial<typeof surveySession.$inferInsert> = {},
) {
	const now = new Date().toISOString();
	await mockDb.insert(surveySession).values({
		id: "session-1",
		protocolKey: "oikos-walkthrough",
		protocolVersion: 1,
		persona: "CITIZEN",
		stateUf: "SP",
		cityName: "São Paulo",
		ageRange: "25-34",
		educationLevel: "superior",
		chainRole: "cidadao",
		wasteContactFrequency: 3,
		appExperience: 3,
		consentVersion: "v1",
		consentAt: now,
		deviceOs: "android",
		deviceOsVersion: "14",
		appVersion: "1.0.0",
		screenSize: "360x800",
		status: "IN_PROGRESS",
		startedAt: now,
		createdAt: now,
		updatedAt: now,
		...overrides,
	});
}

const mockEnqueueAbandon = jest.fn().mockResolvedValue(undefined);
const mockEnqueueCheckpoint = jest.fn().mockResolvedValue(undefined);
const mockDrainOutbox = jest.fn().mockResolvedValue(undefined);
const mockDeleteLocalSurveyData = jest.fn().mockResolvedValue(undefined);

jest.mock("expo-router", () => ({
	useRouter: () => ({
		back: mockBack,
		dismissTo: mockDismissTo,
		replace: mockReplace,
		push: mockPush,
	}),
}));

jest.mock("@/libs/survey/db/client", () => ({
	getSurveyDb: () => mockDb,
}));

jest.mock("@/libs/survey/queue/outbox", () => ({
	enqueueAbandon: (...args: unknown[]) => mockEnqueueAbandon(...args),
	enqueueCheckpoint: (...args: unknown[]) => mockEnqueueCheckpoint(...args),
	drainOutbox: (...args: unknown[]) => mockDrainOutbox(...args),
}));

jest.mock("@/libs/survey/delete-local-data", () => ({
	deleteLocalSurveyData: (...args: unknown[]) =>
		mockDeleteLocalSurveyData(...args),
}));

jest.mock("@/components/survey/hooks/use-survey-protocol");

const protocolFixture = {
	key: "oikos-walkthrough",
	version: 1,
	personas: [
		{ key: "CITIZEN", label: "Cidadão", description: "d", suites: [] },
	],
	suites: [
		{ code: "S1", title: "Exploração livre", objective: "o", task_codes: [] },
		{ code: "S2", title: "Registro e perfil", objective: "o", task_codes: [] },
	],
	tasks: [],
	questions: [],
};

describe("SurveyResumeScreen", () => {
	beforeEach(async () => {
		jest.useFakeTimers();
		mockBack.mockClear();
		mockDismissTo.mockClear();
		mockReplace.mockClear();
		mockPush.mockClear();
		mockEnqueueAbandon.mockClear();
		mockEnqueueCheckpoint.mockClear();
		mockDrainOutbox.mockClear();
		mockDeleteLocalSurveyData.mockClear();
		await mockDb.delete(surveyAnswer).run();
		await mockDb.delete(surveySuiteRun).run();
		await mockDb.delete(surveySession).run();
		await seedSession();
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
			specificObjectives: [],
			tasks: [],
		});
		useSurveyExecutionStore.getState().setSuiteRunId("suite-run-1");
		useSurveyExecutionStore.getState().beginSuite();

		await render(<SurveyResumeScreen />);

		expect(screen.getByText("S1 · Exploração livre")).toBeOnTheScreen();
		expect(screen.getByText("Em andamento")).toBeOnTheScreen();
		expect(screen.getByText("S2 · Registro e perfil")).toBeOnTheScreen();
		expect(screen.getAllByText("Pendente").length).toBeGreaterThan(0);
	});

	it("mostra todas as suítes como concluídas quando a pesquisa está finalizada", async () => {
		useSurveyStore.getState().setStatus("COMPLETED");
		useSurveyExecutionStore.setState({
			suiteQueue: ["S1", "S2"],
			suiteIndex: 2,
			isActive: false,
		});

		await mockDb.insert(surveySuiteRun).values([
			{
				id: "run-s1",
				sessionId: "session-1",
				suiteCode: "S1",
				position: 0,
				startedAt: new Date().toISOString(),
				finishedAt: new Date().toISOString(),
				activeMs: 0,
				wallMs: 0,
				outcome: "YES",
			},
			{
				id: "run-s2",
				sessionId: "session-1",
				suiteCode: "S2",
				position: 1,
				startedAt: new Date().toISOString(),
				finishedAt: new Date().toISOString(),
				activeMs: 0,
				wallMs: 0,
				outcome: "YES",
			},
		]);

		await render(<SurveyResumeScreen />);

		expect(screen.getByText("S1 · Exploração livre")).toBeOnTheScreen();
		expect(screen.getByText("S2 · Registro e perfil")).toBeOnTheScreen();
		expect(
			screen.getAllByText("Concluída · toque para ver respostas").length,
		).toBeGreaterThanOrEqual(2);
		expect(screen.queryByText("Abandonada")).not.toBeOnTheScreen();
	});

	it("mostra o comentário final como concluído quando houver resposta", async () => {
		useSurveyStore.getState().setStatus("COMPLETED");
		useSurveyExecutionStore.setState({
			suiteQueue: ["S1", "S2"],
			suiteIndex: 2,
			isActive: false,
		});

		await mockDb.insert(surveyAnswer).values({
			id: "answer-1",
			sessionId: "session-1",
			suiteRunId: null,
			questionKey: "free_comment",
			valueText: "Ótima experiência",
		});

		await render(<SurveyResumeScreen />);

		expect(screen.getByText("Comentário final")).toBeOnTheScreen();
		expect(screen.getByText("Concluído")).toBeOnTheScreen();
	});

	it("mostra a suíte atual como abandonada quando a pesquisa foi abandonada", async () => {
		useSurveyStore.getState().setStatus("ABANDONED");
		useSurveyExecutionStore.setState({
			suiteQueue: ["S1", "S2"],
			suiteIndex: 0,
			isActive: false,
		});

		await render(<SurveyResumeScreen />);

		expect(screen.getByText("S1 · Exploração livre")).toBeOnTheScreen();
		expect(screen.getByText("S2 · Registro e perfil")).toBeOnTheScreen();
		expect(screen.getAllByText("Abandonada").length).toBe(2);
	});

	it("toca em Caracterização e navega para a tela de respostas do rastreio", async () => {
		const user = userEvent.setup();
		await render(<SurveyResumeScreen />);

		await user.press(screen.getByText("Caracterização"));

		expect(mockPush).toHaveBeenCalledWith("/survey/characterization-answers");
	});

	it("Continuar despausa e fecha de volta para o app quando a etapa está ativa", async () => {
		const user = userEvent.setup();
		useSurveyExecutionStore.getState().openSuiteIntro({
			code: "S1",
			title: "S1",
			objective: "o",
			specificObjectives: [],
			tasks: [],
		});
		useSurveyExecutionStore.getState().setSuiteRunId("suite-run-1");
		useSurveyExecutionStore.getState().beginSuite();
		useSurveyExecutionStore.getState().setPaused(true);

		await render(<SurveyResumeScreen />);
		await user.press(screen.getByText("Continuar"));

		expect(useSurveyExecutionStore.getState().isPaused).toBe(false);
		expect(mockDismissTo).toHaveBeenCalledWith("/(tabs)/(home)");
	});

	it("abre o sheet de excluir dados e, ao confirmar, apaga a cópia local e volta para a home", async () => {
		const user = userEvent.setup();
		await render(<SurveyResumeScreen />);

		await user.press(screen.getByText("Solicitar exclusão dos meus dados"));
		expect(
			screen.getByText("Excluir meus dados da pesquisa?"),
		).toBeOnTheScreen();

		await user.press(screen.getByText("Excluir meus dados"));

		expect(mockDeleteLocalSurveyData).toHaveBeenCalledWith("session-1");
		expect(useSurveyStore.getState().sessionId).toBeNull();
		expect(mockDismissTo).toHaveBeenCalledWith("/(tabs)/(home)");
	});

	it("cancelar no sheet de excluir dados não apaga nada", async () => {
		const user = userEvent.setup();
		await render(<SurveyResumeScreen />);

		await user.press(screen.getByText("Solicitar exclusão dos meus dados"));
		await user.press(screen.getByText("Cancelar"));

		expect(mockDeleteLocalSurveyData).not.toHaveBeenCalled();
		expect(
			screen.queryByText("Excluir meus dados da pesquisa?"),
		).not.toBeOnTheScreen();
	});

	it("abre o sheet de abandonar e, ao confirmar, registra o abandono, marca as etapas ainda não iniciadas como NO, e volta para a home", async () => {
		const user = userEvent.setup();
		await render(<SurveyResumeScreen />);

		await user.press(screen.getByText("Abandonar a pesquisa"));
		expect(screen.getByText("Abandonar a pesquisa?")).toBeOnTheScreen();

		await user.press(screen.getByText("Sim, abandonar"));

		// Nenhuma suíte foi iniciada (suiteRunId nulo) — S1 e S2 recebem checkpoint
		// sintético com outcome NO forçado, antes do E5.
		expect(mockEnqueueCheckpoint).toHaveBeenCalledTimes(2);
		expect(mockEnqueueCheckpoint.mock.calls[0][2].suite).toEqual(
			expect.objectContaining({ code: "S1", outcome: "NO" }),
		);
		expect(mockEnqueueCheckpoint.mock.calls[1][2].suite).toEqual(
			expect.objectContaining({ code: "S2", outcome: "NO" }),
		);
		expect(mockEnqueueAbandon).toHaveBeenCalledWith(
			"session-1",
			expect.objectContaining({ session_id: "session-1" }),
		);
		expect(useSurveyStore.getState().status).toBe("ABANDONED");
		expect(mockDismissTo).toHaveBeenCalledWith("/(tabs)/(home)");
	});

	it("suíte em andamento no momento do abandono usa a fórmula normal de contagem, não NO forçado", async () => {
		const user = userEvent.setup();
		const now = new Date().toISOString();
		useSurveyExecutionStore.getState().openSuiteIntro({
			code: "S1",
			title: "S1",
			objective: "o",
			specificObjectives: [],
			tasks: [{ code: "T1", title: "a", instruction: "a" }],
		});
		useSurveyExecutionStore.getState().setSuiteRunId("suite-run-1");
		useSurveyExecutionStore.getState().beginSuite();
		useSurveyExecutionStore.getState().completeCurrentTask();

		await mockDb.insert(surveySuiteRun).values({
			id: "suite-run-1",
			sessionId: "session-1",
			suiteCode: "S1",
			position: 0,
			startedAt: now,
			activeMs: 0,
			wallMs: 0,
		});

		await render(<SurveyResumeScreen />);

		await user.press(screen.getByText("Abandonar a pesquisa"));
		await user.press(screen.getByText("Sim, abandonar"));

		// Suíte S1 em andamento com 1/1 tarefa concluída -> YES pela fórmula normal.
		// Só S2 (nunca iniciada) recebe NO forçado.
		expect(mockEnqueueCheckpoint).toHaveBeenCalledTimes(2);
		expect(mockEnqueueCheckpoint.mock.calls[0][2].suite).toEqual(
			expect.objectContaining({ code: "S1", outcome: "YES" }),
		);
		expect(mockEnqueueCheckpoint.mock.calls[1][2].suite).toEqual(
			expect.objectContaining({ code: "S2", outcome: "NO" }),
		);
	});
});
