import { renderHook } from "@testing-library/react-native";
import { useSurveyContinue } from "@/components/survey/hooks/use-survey-continue";
import { useSurveyExecutionStore } from "@/stores/survey-execution-store";
import { useSurveyStore } from "@/stores/survey-store";

const mockReplace = jest.fn();
const mockDismissTo = jest.fn();

jest.mock("expo-router", () => ({
	useRouter: () => ({
		replace: mockReplace,
		dismissTo: mockDismissTo,
	}),
}));

describe("useSurveyContinue", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		useSurveyStore.getState().reset();
		useSurveyExecutionStore.getState().reset();
	});

	it("não faz nada quando a pesquisa está ABANDONED", async () => {
		useSurveyStore.getState().startSession("session-1", "CITIZEN");
		useSurveyStore.getState().setStatus("ABANDONED");

		const { result } = await renderHook(() => useSurveyContinue());
		result.current();

		expect(mockReplace).not.toHaveBeenCalled();
		expect(mockDismissTo).not.toHaveBeenCalled();
	});

	it("não faz nada quando a pesquisa está COMPLETED", async () => {
		useSurveyStore.getState().startSession("session-1", "CITIZEN");
		useSurveyStore.getState().setStatus("COMPLETED");

		const { result } = await renderHook(() => useSurveyContinue());
		result.current();

		expect(mockReplace).not.toHaveBeenCalled();
		expect(mockDismissTo).not.toHaveBeenCalled();
	});

	it("despausa e volta pro app quando a suíte está ativa", async () => {
		useSurveyStore.getState().startSession("session-1", "CITIZEN");
		useSurveyExecutionStore.getState().initRoteiro(["S1", "S2"]);
		useSurveyExecutionStore.getState().openSuiteIntro({
			code: "S1",
			title: "Etapa 1",
			objective: "Objetivo",
			specificObjectives: [],
			tasks: [],
		});
		useSurveyExecutionStore.getState().setSuiteRunId("suite-run-1");
		useSurveyExecutionStore.getState().beginSuite();
		useSurveyExecutionStore.getState().setPaused(true);

		const { result } = await renderHook(() => useSurveyContinue());
		result.current();

		expect(useSurveyExecutionStore.getState().isPaused).toBe(false);
		expect(mockDismissTo).toHaveBeenCalledWith("/(tabs)/(home)");
		expect(mockReplace).not.toHaveBeenCalled();
	});

	it("vai pra suite-intro quando ainda há suítes pendentes no roteiro", async () => {
		useSurveyStore.getState().startSession("session-1", "CITIZEN");
		useSurveyExecutionStore.getState().initRoteiro(["S1", "S2"]);
		useSurveyExecutionStore.getState().openSuiteIntro({
			code: "S1",
			title: "Etapa 1",
			objective: "Objetivo",
			specificObjectives: [],
			tasks: [],
		});
		useSurveyExecutionStore.getState().beginSuite();
		useSurveyExecutionStore.getState().finishSuite();

		const { result } = await renderHook(() => useSurveyContinue());
		result.current();

		expect(mockReplace).toHaveBeenCalledWith("/survey/suite-intro");
	});

	it("vai pro comentário final quando todas as suítes do roteiro terminaram", async () => {
		useSurveyStore.getState().startSession("session-1", "CITIZEN");
		useSurveyExecutionStore.getState().initRoteiro(["S1"]);
		useSurveyExecutionStore.getState().openSuiteIntro({
			code: "S1",
			title: "Etapa 1",
			objective: "Objetivo",
			specificObjectives: [],
			tasks: [],
		});
		useSurveyExecutionStore.getState().beginSuite();
		useSurveyExecutionStore.getState().finishSuite();

		const { result } = await renderHook(() => useSurveyContinue());
		result.current();

		expect(mockReplace).toHaveBeenCalledWith("/survey/closing-comment");
	});
});
