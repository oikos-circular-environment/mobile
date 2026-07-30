import { render, screen, userEvent } from "@testing-library/react-native";
import { SurveyExecutionOverlay } from "@/components/survey/survey-execution-overlay";
import { useSurveyExecutionStore } from "@/stores/survey-execution-store";
import { useSurveyStore } from "@/stores/survey-store";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
	useRouter: () => ({ push: mockPush }),
}));

describe("SurveyExecutionOverlay", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		mockPush.mockClear();
		useSurveyExecutionStore.getState().reset();
		useSurveyStore.getState().reset();
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
		expect(screen.queryByText(/consegui/i)).not.toBeOnTheScreen();
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
});
