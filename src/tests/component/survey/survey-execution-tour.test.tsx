import { render, screen, userEvent } from "@testing-library/react-native";
import { useSurveyProtocol } from "@/components/survey/hooks/use-survey-protocol";
import { useSurveyTourSeen } from "@/components/survey/hooks/use-survey-tour-seen";
import { SurveyExecutionOverlay } from "@/components/survey/survey-execution-overlay";
import { TOUR_STEP_COUNT } from "@/components/survey/survey-execution-tour-steps";
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

async function pressNextAndFind(
	user: ReturnType<typeof userEvent.setup>,
	nextStepText: string,
) {
	await user.press(screen.getByText("Próximo"));
	return screen.findByText(nextStepText);
}

function startSurveyWithTaskCard() {
	useSurveyStore.getState().startSession("session-1", "CITIZEN");
	useSurveyExecutionStore.getState().openSuiteIntro({
		code: "S1",
		title: "S1",
		objective: "obj",
		specificObjectives: [],
		tasks: [{ code: "T8", title: "a", instruction: "Busque algo." }],
	});
	useSurveyExecutionStore.getState().beginSuite();
}

describe("SurveyExecutionOverlay - tour guiado", () => {
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
		jest.mocked(useSurveyTourSeen).mockReturnValue({
			loaded: true,
			seen: false,
			markSeen: mockMarkSeen,
		});
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("inicia o tour automaticamente e mostra o primeiro passo", async () => {
		startSurveyWithTaskCard();

		await render(<SurveyExecutionOverlay />);

		expect(
			await screen.findByText(
				"Aqui estão as tarefas desta etapa. Acompanhe o progresso de cada uma.",
			),
		).toBeOnTheScreen();
		expect(mockMarkSeen).toHaveBeenCalled();
	});

	it("avança para o próximo passo ao tocar em Próximo", async () => {
		const user = userEvent.setup();
		startSurveyWithTaskCard();

		await render(<SurveyExecutionOverlay />);
		await screen.findByText(
			"Aqui estão as tarefas desta etapa. Acompanhe o progresso de cada uma.",
		);
		const nextStep = await pressNextAndFind(
			user,
			"Este é o tempo que você está gastando nesta etapa.",
		);

		expect(nextStep).toBeOnTheScreen();
		expect(
			screen.queryByText(
				"Aqui estão as tarefas desta etapa. Acompanhe o progresso de cada uma.",
			),
		).not.toBeOnTheScreen();
	});

	it("chega no passo do indicador flutuante e o card expandido é minimizado", async () => {
		const user = userEvent.setup();
		startSurveyWithTaskCard();

		await render(<SurveyExecutionOverlay />);
		await screen.findByText(
			"Aqui estão as tarefas desta etapa. Acompanhe o progresso de cada uma.",
		);

		const stepTexts = [
			"Este é o tempo que você está gastando nesta etapa.",
			"Precisa parar? Toque em Pausar para continuar depois.",
			"Não consegue fazer esta tarefa agora? Pule para a próxima ou abandone-a.",
			"Se precisar desistir de toda a etapa, use este botão.",
			"Para liberar a tela enquanto faz a tarefa, minimize este cartão tocando fora dele ou pelo botão Minimizar.",
			"Pronto! O cartão virou um indicador. Toque nele para reabrir a qualquer momento, ou arraste-o para outro lugar da tela.",
		];
		expect(stepTexts).toHaveLength(TOUR_STEP_COUNT - 1);

		let lastStep: ReturnType<typeof screen.getByText> | undefined;
		for (const stepText of stepTexts) {
			lastStep = await pressNextAndFind(user, stepText);
		}

		expect(lastStep).toBeOnTheScreen();
		expect(screen.queryByText("Busque algo.")).not.toBeOnTheScreen();
	});

	it("não inicia o tour quando já foi visto", async () => {
		jest.mocked(useSurveyTourSeen).mockReturnValue({
			loaded: true,
			seen: true,
			markSeen: mockMarkSeen,
		});
		startSurveyWithTaskCard();

		await render(<SurveyExecutionOverlay />);

		expect(
			screen.queryByText(
				"Aqui estão as tarefas desta etapa. Acompanhe o progresso de cada uma.",
			),
		).not.toBeOnTheScreen();
	});

	it("repetir tutorial com todas as tarefas resolvidas pula os passos de tarefa atual/abandonar suíte sem travar", async () => {
		const user = userEvent.setup();
		jest.mocked(useSurveyTourSeen).mockReturnValue({
			loaded: true,
			seen: true,
			markSeen: mockMarkSeen,
		});
		startSurveyWithTaskCard();
		useSurveyExecutionStore.getState().abandonCurrentTask();

		await render(<SurveyExecutionOverlay />);
		await user.press(screen.getByText("Repetir tutorial"));

		expect(
			await screen.findByText(
				"Aqui estão as tarefas desta etapa. Acompanhe o progresso de cada uma.",
			),
		).toBeOnTheScreen();
		expect(screen.getByText("1/5")).toBeOnTheScreen();

		const stepTexts = [
			"Este é o tempo que você está gastando nesta etapa.",
			"Precisa parar? Toque em Pausar para continuar depois.",
			"Para liberar a tela enquanto faz a tarefa, minimize este cartão tocando fora dele ou pelo botão Minimizar.",
			"Pronto! O cartão virou um indicador. Toque nele para reabrir a qualquer momento, ou arraste-o para outro lugar da tela.",
		];

		// TaskCard resolvida também mostra um botão "Próximo" no rodapé — o do
		// tooltip do tour é o último da árvore.
		let lastStep: ReturnType<typeof screen.getByText> | undefined;
		for (const stepText of stepTexts) {
			const nextButtons = screen.getAllByText("Próximo");
			await user.press(nextButtons[nextButtons.length - 1] as never);
			lastStep = await screen.findByText(stepText);
		}

		expect(lastStep).toBeOnTheScreen();
		expect(
			screen.queryByText(
				"Não consegue fazer esta tarefa agora? Pule para a próxima ou abandone-a.",
			),
		).not.toBeOnTheScreen();
		expect(
			screen.queryByText(
				"Se precisar desistir de toda a etapa, use este botão.",
			),
		).not.toBeOnTheScreen();
	});
});
