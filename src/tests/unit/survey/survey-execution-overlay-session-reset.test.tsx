import {
	act,
	render,
	screen,
	userEvent,
	waitFor,
} from "@testing-library/react-native";
import { useSurveyParticipantCode } from "@/components/survey/hooks/use-survey-participant-code";
import { useSurveyProtocol } from "@/components/survey/hooks/use-survey-protocol";
import { useSurveyTourSeen } from "@/components/survey/hooks/use-survey-tour-seen";
import { SurveyExecutionOverlay } from "@/components/survey/survey-execution-overlay";
import { toast } from "@/components/toast";
import { createTestSurveyDb } from "@/libs/survey/db/test-client";
import { useSurveyExecutionStore } from "@/stores/survey-execution-store";
import { useSurveyStore } from "@/stores/survey-store";

const mockPush = jest.fn();
const mockDb = createTestSurveyDb();
const mockNotificationAsync = jest.fn();
const mockMarkSeen = jest.fn();

jest.mock("expo-router", () => ({
	useRouter: () => ({ push: mockPush }),
	usePathname: () => "/",
	useSegments: () => ["(tabs)", "(home)"],
}));

jest.mock("@/libs/survey/db/client", () => ({
	getSurveyDb: () => mockDb,
}));

jest.mock("@/components/survey/hooks/use-survey-protocol");

jest.mock("@/components/survey/hooks/use-survey-participant-code");

jest.mock("@/components/survey/hooks/use-survey-tour-seen", () => ({
	useSurveyTourSeen: jest.fn(),
}));

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

async function pressNext(user: ReturnType<typeof userEvent.setup>) {
	const nextButtons = screen.getAllByText("Próximo");
	await user.press(nextButtons[nextButtons.length - 1] as never);
}

const CHECKLIST_TEXT =
	"Aqui estão as tarefas desta etapa. Acompanhe o progresso de cada uma.";
const TIMER_TEXT = "Este é o tempo que você está gastando nesta etapa.";
const SKIP_OR_ABANDON_TASK_TEXT =
	"Não consegue fazer esta tarefa agora? Pule para a próxima ou abandone-a.";
const MINIMIZE_TEXT =
	"Para liberar a tela enquanto faz a tarefa, minimize este cartão tocando fora dele ou pelo botão Minimizar.";

describe("SurveyExecutionOverlay - reset de estado ao trocar de sessão", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		mockPush.mockClear();
		mockNotificationAsync.mockClear();
		mockMarkSeen.mockClear();
		jest.mocked(toast.success).mockClear();
		useSurveyExecutionStore.getState().reset();
		useSurveyStore.getState().reset();
		jest.mocked(useSurveyProtocol).mockReturnValue({
			data: { tasks: [] },
		} as never);
		jest.mocked(useSurveyParticipantCode).mockReturnValue("PSQ-7X29-QK41");
		jest.mocked(useSurveyTourSeen).mockReturnValue({
			loaded: true,
			seen: true,
			markSeen: mockMarkSeen,
		});
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("não herda o passo 'todas as tarefas resolvidas' de uma sessão anterior ao trocar de sessão em tarefa aberta", async () => {
		const user = userEvent.setup();

		useSurveyStore.getState().startSession("session-1", "CITIZEN");
		useSurveyExecutionStore.getState().openSuiteIntro({
			code: "S1",
			title: "S1",
			objective: "obj",
			specificObjectives: [],
			tasks: [{ code: "T8", title: "a", instruction: "Busque algo." }],
		});
		useSurveyExecutionStore.getState().beginSuite();
		useSurveyExecutionStore.getState().abandonCurrentTask();

		await render(<SurveyExecutionOverlay />);

		await user.press(screen.getByText("Repetir tutorial"));
		expect(await screen.findByText(CHECKLIST_TEXT)).toBeOnTheScreen();

		await pressNext(user);
		await screen.findByText(TIMER_TEXT);

		// Simula a exclusão do teste em andamento: a suíte é abandonada, o overlay
		// fica inelegível por um instante (como acontece ao navegar pra fora da
		// execução) e a sessão anterior nunca chama `onStop` do tour — exatamente o
		// cenário abrupto do bug.
		await act(() => {
			useSurveyExecutionStore.getState().reset();
		});
		await waitFor(() => {
			expect(screen.queryByText("Repetir tutorial")).not.toBeOnTheScreen();
		});

		await act(() => {
			useSurveyStore.getState().startSession("session-2", "CITIZEN");
			useSurveyExecutionStore.getState().openSuiteIntro({
				code: "S2",
				title: "S2",
				objective: "obj",
				specificObjectives: [],
				tasks: [{ code: "T9", title: "b", instruction: "Faça outra coisa." }],
			});
			useSurveyExecutionStore.getState().beginSuite();
		});

		await user.press(await screen.findByText("Repetir tutorial"));
		expect(await screen.findByText(CHECKLIST_TEXT)).toBeOnTheScreen();

		await pressNext(user);
		await screen.findByText(TIMER_TEXT);
		await pressNext(user);
		await screen.findByText(
			"Precisa parar? Toque em Pausar para continuar depois.",
		);

		await pressNext(user);
		expect(
			await screen.findByText(SKIP_OR_ABANDON_TASK_TEXT),
		).toBeOnTheScreen();
		expect(screen.queryByText(MINIMIZE_TEXT)).not.toBeOnTheScreen();
	});
});
