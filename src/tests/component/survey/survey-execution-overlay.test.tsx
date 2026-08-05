import { render, screen, userEvent } from "@testing-library/react-native";
import { useSurveyProtocol } from "@/components/survey/hooks/use-survey-protocol";
import { SurveyExecutionOverlay } from "@/components/survey/survey-execution-overlay";
import { toast } from "@/components/toast";
import { createTestSurveyDb } from "@/libs/survey/db/test-client";
import { useSurveyExecutionStore } from "@/stores/survey-execution-store";
import { useSurveyStore } from "@/stores/survey-store";

const mockPush = jest.fn();
const mockDb = createTestSurveyDb();
const mockNotificationAsync = jest.fn();

jest.mock("expo-router", () => ({
	useRouter: () => ({ push: mockPush }),
	usePathname: () => "/",
}));

jest.mock("@/libs/survey/db/client", () => ({
	getSurveyDb: () => mockDb,
}));

jest.mock("@/components/survey/hooks/use-survey-protocol");

jest.mock("expo-haptics", () => ({
	notificationAsync: (...args: unknown[]) => mockNotificationAsync(...args),
	NotificationFeedbackType: { Success: "success" },
}));

jest.mock("@/components/toast", () => ({
	toast: {
		success: jest.fn(),
		error: jest.fn(),
		info: jest.fn(),
		warning: jest.fn(),
	},
}));

describe("SurveyExecutionOverlay", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		mockPush.mockClear();
		mockNotificationAsync.mockClear();
		jest.mocked(toast.success).mockClear();
		useSurveyExecutionStore.getState().reset();
		useSurveyStore.getState().reset();
		jest.mocked(useSurveyProtocol).mockReturnValue({
			data: { tasks: [] },
		} as never);
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("não renderiza nada fora de uma sessão em andamento", async () => {
		await render(<SurveyExecutionOverlay />);

		expect(screen.queryByText(/\d\/\d/)).not.toBeOnTheScreen();
	});

	it("mostra o indicador recolhido quando a etapa está ativa", async () => {
		useSurveyStore.getState().startSession("session-1", "CITIZEN");
		useSurveyExecutionStore.getState().openSuiteIntro({
			code: "S1",
			title: "S1",
			objective: "obj",
			tasks: [{ code: "T8", title: "a", instruction: "Busque algo." }],
		});
		useSurveyExecutionStore.getState().beginSuite();

		await render(<SurveyExecutionOverlay />);

		expect(screen.getByText("0/1")).toBeOnTheScreen();
	});

	it("expande o cartão da tarefa ao tocar no indicador, sem ação de autodeclarar sucesso", async () => {
		const user = userEvent.setup();
		useSurveyStore.getState().startSession("session-1", "CITIZEN");
		useSurveyExecutionStore.getState().openSuiteIntro({
			code: "S1",
			title: "S1",
			objective: "obj",
			tasks: [{ code: "T8", title: "a", instruction: "Busque algo." }],
		});
		useSurveyExecutionStore.getState().beginSuite();

		await render(<SurveyExecutionOverlay />);
		await user.press(screen.getByText("0/1"));

		expect(screen.getByText("Busque algo.")).toBeOnTheScreen();
		expect(screen.queryByText(/^consegui$/i)).not.toBeOnTheScreen();
	});

	it("pausar esconde o indicador", async () => {
		const user = userEvent.setup();
		useSurveyStore.getState().startSession("session-1", "CITIZEN");
		useSurveyExecutionStore.getState().openSuiteIntro({
			code: "S1",
			title: "S1",
			objective: "obj",
			tasks: [{ code: "T8", title: "a", instruction: "Busque algo." }],
		});
		useSurveyExecutionStore.getState().beginSuite();

		await render(<SurveyExecutionOverlay />);
		await user.press(screen.getByText("0/1"));
		await user.press(screen.getByText("Pausar"));

		expect(useSurveyExecutionStore.getState().isPaused).toBe(true);
		expect(screen.queryByText("Busque algo.")).not.toBeOnTheScreen();
	});

	it("pular tarefa (inline, abaixo da tarefa atual) reordena o checklist e mantém a suíte em aberto", async () => {
		const user = userEvent.setup();
		useSurveyStore.getState().startSession("session-1", "CITIZEN");
		useSurveyExecutionStore.getState().openSuiteIntro({
			code: "S1",
			title: "S1",
			objective: "obj",
			tasks: [
				{ code: "T1", title: "Primeira", instruction: "Faça a primeira." },
				{ code: "T2", title: "Segunda", instruction: "Faça a segunda." },
			],
		});
		useSurveyExecutionStore.getState().beginSuite();

		await render(<SurveyExecutionOverlay />);
		await user.press(screen.getByText("0/2"));
		await user.press(screen.getByText("Pular"));

		expect(screen.getByText("Faça a segunda.")).toBeOnTheScreen();
		expect(useSurveyExecutionStore.getState().tasks.map(t => t.status)).toEqual(
			["current", "skipped"],
		);
	});

	it("abandonar a tarefa atual (inline) marca outcome NO e avança pra próxima", async () => {
		const user = userEvent.setup();
		useSurveyStore.getState().startSession("session-1", "CITIZEN");
		useSurveyExecutionStore.getState().openSuiteIntro({
			code: "S1",
			title: "S1",
			objective: "obj",
			tasks: [
				{ code: "T1", title: "Primeira", instruction: "Faça a primeira." },
				{ code: "T2", title: "Segunda", instruction: "Faça a segunda." },
			],
		});
		useSurveyExecutionStore.getState().beginSuite();

		await render(<SurveyExecutionOverlay />);
		await user.press(screen.getByText("0/2"));
		// Dois botões "Abandonar" na tela: o inline (tarefa atual) e o de rodapé (etapa).
		// O inline vem primeiro na árvore.
		const abandonButtons = screen.getAllByText("Abandonar");
		await user.press(abandonButtons[0] as never);

		const tasks = useSurveyExecutionStore.getState().tasks;
		expect(tasks[0]?.status).toBe("abandoned");
		expect(tasks[0]?.outcome).toBe("NO");
		expect(tasks[1]?.status).toBe("current");
	});

	it("ao resolver todas as tarefas: vibra, mostra toast e expande o overlay sozinho", async () => {
		const user = userEvent.setup();
		useSurveyStore.getState().startSession("session-1", "CITIZEN");
		useSurveyExecutionStore.getState().openSuiteIntro({
			code: "S1",
			title: "S1",
			objective: "obj",
			tasks: [{ code: "T1", title: "Única", instruction: "Faça." }],
		});
		useSurveyExecutionStore.getState().beginSuite();

		await render(<SurveyExecutionOverlay />);
		await user.press(screen.getByText("0/1"));
		const abandonButtons = screen.getAllByText("Abandonar");
		await user.press(abandonButtons[0] as never);

		expect(mockNotificationAsync).toHaveBeenCalledTimes(1);
		expect(toast.success).toHaveBeenCalledTimes(1);
		expect(useSurveyExecutionStore.getState().isExpanded).toBe(true);
		expect(screen.getByText("Próximo")).toBeOnTheScreen();
	});

	it("o botão de rodapé Abandonar força outcome NO na suíte, navega pro questionário e não dispara a celebração", async () => {
		const user = userEvent.setup();
		useSurveyStore.getState().startSession("session-1", "CITIZEN");
		useSurveyExecutionStore.getState().openSuiteIntro({
			code: "S1",
			title: "S1",
			objective: "obj",
			tasks: [
				{ code: "T1", title: "Primeira", instruction: "Faça a primeira." },
				{ code: "T2", title: "Segunda", instruction: "Faça a segunda." },
			],
		});
		useSurveyExecutionStore.getState().beginSuite();

		await render(<SurveyExecutionOverlay />);
		await user.press(screen.getByText("0/2"));
		// Índice 1: o botão de rodapé, que troca de lugar com "Próximo".
		const abandonButtons = screen.getAllByText("Abandonar");
		await user.press(abandonButtons[abandonButtons.length - 1] as never);

		const state = useSurveyExecutionStore.getState();
		expect(state.suiteOutcomeOverride).toBe("NO");
		expect(state.tasks.every(t => t.status === "abandoned")).toBe(true);
		expect(mockPush).toHaveBeenCalledWith("/survey/questionnaire");
		expect(mockNotificationAsync).not.toHaveBeenCalled();
		expect(toast.success).not.toHaveBeenCalled();
	});
});
