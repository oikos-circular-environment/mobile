import { useSurveyExecutionStore } from "@/stores/survey-execution-store";

describe("survey-execution-store", () => {
	beforeEach(() => {
		useSurveyExecutionStore.getState().reset();
	});

	it("initRoteiro grava o roteiro da persona", () => {
		useSurveyExecutionStore.getState().initRoteiro(["S1", "S2", "S3"]);

		expect(useSurveyExecutionStore.getState().suiteQueue).toEqual([
			"S1",
			"S2",
			"S3",
		]);
		expect(useSurveyExecutionStore.getState().suiteIndex).toBe(0);
	});

	it("openSuiteIntro marca a primeira tarefa como atual e as demais como pendentes", () => {
		useSurveyExecutionStore.getState().openSuiteIntro({
			code: "S1",
			title: "Exploração livre",
			objective: "Explore o app.",
			tasks: [
				{ code: "T8", title: "Buscar", instruction: "Busque algo." },
				{ code: "T9", title: "Ver", instruction: "Veja algo." },
			],
		});

		const state = useSurveyExecutionStore.getState();
		expect(state.tasks).toEqual([
			{
				code: "T8",
				title: "Buscar",
				instruction: "Busque algo.",
				status: "current",
			},
			{
				code: "T9",
				title: "Ver",
				instruction: "Veja algo.",
				status: "pending",
			},
		]);
		expect(state.isActive).toBe(false);
	});

	it("completeCurrentTask avança para a próxima tarefa sem confirmação", () => {
		useSurveyExecutionStore.getState().openSuiteIntro({
			code: "S1",
			title: "S1",
			objective: "obj",
			tasks: [
				{ code: "T8", title: "a", instruction: "a" },
				{ code: "T9", title: "b", instruction: "b" },
			],
		});

		useSurveyExecutionStore.getState().completeCurrentTask();

		const state = useSurveyExecutionStore.getState();
		expect(state.tasks[0]?.status).toBe("done");
		expect(state.tasks[1]?.status).toBe("current");
		expect(state.currentTaskIndex).toBe(1);
	});

	it("uma tarefa sem sinal detectado não bloqueia: não existe ação de declarar sucesso/falha no store", () => {
		const actions = Object.keys(useSurveyExecutionStore.getState());
		expect(actions).not.toContain("markTaskFailed");
		expect(actions).not.toContain("declareSuccess");
	});

	it("addActiveMs acumula, e pausa não é responsabilidade do store (quem chama decide quando parar de tickar)", () => {
		useSurveyExecutionStore.getState().addActiveMs(1000);
		useSurveyExecutionStore.getState().addActiveMs(500);

		expect(useSurveyExecutionStore.getState().suiteActiveMs).toBe(1500);
	});

	it("finishSuite avança o índice da etapa e desativa a execução", () => {
		useSurveyExecutionStore.getState().initRoteiro(["S1", "S2"]);
		useSurveyExecutionStore.getState().beginSuite();

		useSurveyExecutionStore.getState().finishSuite();

		expect(useSurveyExecutionStore.getState().suiteIndex).toBe(1);
		expect(useSurveyExecutionStore.getState().isActive).toBe(false);
	});
});
