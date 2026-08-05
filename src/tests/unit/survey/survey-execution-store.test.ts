import {
	selectAllTasksResolved,
	selectResolvedTaskCount,
	useSurveyExecutionStore,
} from "@/stores/survey-execution-store";

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
				position: 0,
			},
			{
				code: "T9",
				title: "Ver",
				instruction: "Veja algo.",
				status: "pending",
				position: 1,
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
		expect(state.tasks[0]?.outcome).toBe("YES");
		expect(state.tasks[1]?.status).toBe("current");
		expect(state.currentTaskIndex).toBe(1);
	});

	it("uma tarefa sem sinal detectado não bloqueia: não existe ação de declarar sucesso no store", () => {
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

	describe("skipCurrentTask", () => {
		beforeEach(() => {
			useSurveyExecutionStore.getState().openSuiteIntro({
				code: "S1",
				title: "S1",
				objective: "obj",
				tasks: [
					{ code: "T1", title: "a", instruction: "a" },
					{ code: "T2", title: "b", instruction: "b" },
					{ code: "T3", title: "c", instruction: "c" },
				],
			});
		});

		it("manda a tarefa atual pro fim da fila como 'skipped' e ativa a próxima", () => {
			useSurveyExecutionStore.getState().skipCurrentTask();

			const state = useSurveyExecutionStore.getState();
			expect(state.tasks.map(t => [t.code, t.status])).toEqual([
				["T2", "current"],
				["T3", "pending"],
				["T1", "skipped"],
			]);
			expect(state.currentTaskIndex).toBe(0);
		});

		it("pular a mesma tarefa duas vezes faz ela voltar a ser a atual depois das outras (traço completo)", () => {
			const store = useSurveyExecutionStore;

			// [T1(current) T2(pending) T3(pending)]
			store.getState().skipCurrentTask(); // skip T1
			// [T2(current) T3(pending) T1(skipped)]
			expect(store.getState().tasks.map(t => t.code)).toEqual([
				"T2",
				"T3",
				"T1",
			]);

			store.getState().completeCurrentTask(); // complete T2
			// [T2(done) T3(current) T1(skipped)]
			expect(store.getState().tasks[1]?.code).toBe("T3");
			expect(store.getState().tasks[1]?.status).toBe("current");

			store.getState().skipCurrentTask(); // skip T3
			// [T2(done) T1(current) T3(skipped)] — T1 volta a ficar current
			const afterSecondSkip = store.getState();
			expect(afterSecondSkip.tasks.map(t => [t.code, t.status])).toEqual([
				["T2", "done"],
				["T1", "current"],
				["T3", "skipped"],
			]);

			store.getState().completeCurrentTask(); // complete T1
			store.getState().completeCurrentTask(); // complete T3 (agora current)
			const final = store.getState();
			expect(final.tasks.every(t => t.status === "done")).toBe(true);
		});
	});

	describe("abandonCurrentTask", () => {
		it("marca a tarefa atual como abandoned com outcome NO e avança", () => {
			useSurveyExecutionStore.getState().openSuiteIntro({
				code: "S1",
				title: "S1",
				objective: "obj",
				tasks: [
					{ code: "T1", title: "a", instruction: "a" },
					{ code: "T2", title: "b", instruction: "b" },
				],
			});

			useSurveyExecutionStore.getState().abandonCurrentTask();

			const state = useSurveyExecutionStore.getState();
			expect(state.tasks[0]?.status).toBe("abandoned");
			expect(state.tasks[0]?.outcome).toBe("NO");
			expect(state.tasks[1]?.status).toBe("current");
		});
	});

	describe("abandonSuite", () => {
		it("resolve toda tarefa não-terminal como abandoned/NO e força o outcome da suíte", () => {
			useSurveyExecutionStore.getState().openSuiteIntro({
				code: "S1",
				title: "S1",
				objective: "obj",
				tasks: [
					{ code: "T1", title: "a", instruction: "a" },
					{ code: "T2", title: "b", instruction: "b" },
					{ code: "T3", title: "c", instruction: "c" },
				],
			});
			useSurveyExecutionStore.getState().completeCurrentTask(); // T1 done

			useSurveyExecutionStore.getState().abandonSuite();

			const state = useSurveyExecutionStore.getState();
			expect(state.tasks[0]?.status).toBe("done");
			expect(state.tasks[1]?.status).toBe("abandoned");
			expect(state.tasks[1]?.outcome).toBe("NO");
			expect(state.tasks[2]?.status).toBe("abandoned");
			expect(state.tasks[2]?.outcome).toBe("NO");
			expect(state.suiteOutcomeOverride).toBe("NO");
			expect(state.currentTaskIndex).toBe(state.tasks.length);
		});
	});

	describe("selectAllTasksResolved / selectResolvedTaskCount", () => {
		it("skipped não conta como resolvido; done e abandoned contam", () => {
			useSurveyExecutionStore.getState().openSuiteIntro({
				code: "S1",
				title: "S1",
				objective: "obj",
				tasks: [
					{ code: "T1", title: "a", instruction: "a" },
					{ code: "T2", title: "b", instruction: "b" },
				],
			});
			useSurveyExecutionStore.getState().skipCurrentTask(); // T1 skipped, T2 current

			expect(selectAllTasksResolved(useSurveyExecutionStore.getState())).toBe(
				false,
			);
			expect(selectResolvedTaskCount(useSurveyExecutionStore.getState())).toBe(
				0,
			);

			useSurveyExecutionStore.getState().abandonCurrentTask(); // T2 abandoned, T1 volta a current

			expect(selectAllTasksResolved(useSurveyExecutionStore.getState())).toBe(
				false,
			);

			useSurveyExecutionStore.getState().abandonCurrentTask(); // T1 abandoned

			const finalState = useSurveyExecutionStore.getState();
			expect(selectAllTasksResolved(finalState)).toBe(true);
			expect(selectResolvedTaskCount(finalState)).toBe(2);
		});
	});
});
