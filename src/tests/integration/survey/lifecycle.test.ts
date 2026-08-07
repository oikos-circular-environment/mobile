import {
	countResolved,
	createSurveyQueueLifecycle,
	TICK_MS,
} from "@/libs/survey/queue/lifecycle";

describe("ciclo de vida da fila", () => {
	function buildDeps(
		overrides?: Partial<Parameters<typeof createSurveyQueueLifecycle>[0]>,
	) {
		const sessionId: { current: string | null } = { current: null };
		const execution: {
			current: { isActive: boolean; tasksSignature: string };
		} = {
			current: { isActive: true, tasksSignature: "" },
		};
		const drain = jest.fn().mockResolvedValue(undefined);
		const intervals: Array<{ id: number; callback: () => void; ms: number }> =
			[];
		let nextIntervalId = 1;

		const deps = {
			getActiveSessionId: () => sessionId.current,
			getActiveExecutionState: () => execution.current,
			drain,
			setInterval: (callback: () => void, ms: number) => {
				const id = nextIntervalId++;
				intervals.push({ id, callback, ms });
				return id as unknown as ReturnType<typeof setInterval>;
			},
			clearInterval: jest.fn(),
			...overrides,
		};

		return {
			...deps,
			sessionId,
			execution,
			drain,
			intervals,
			setSessionId: (value: string | null) => {
				sessionId.current = value;
			},
			setExecution: (value: { isActive: boolean; tasksSignature: string }) => {
				execution.current = value;
			},
		};
	}

	it("countResolved conta tarefas finalizadas", () => {
		expect(countResolved("T1:done,T2:pending,T3:abandoned")).toBe(2);
		expect(countResolved("")).toBe(0);
	});

	it("triggerDrain chama drain e engole erro", async () => {
		const deps = buildDeps({
			drain: jest.fn().mockRejectedValue(new Error("boom")),
		});
		const lifecycle = createSurveyQueueLifecycle(deps);
		deps.setSessionId("session-1");
		lifecycle.handleAppStateActive();
		await new Promise(resolve => setTimeout(resolve, 10));
		expect(deps.drain).toHaveBeenCalledWith("session-1");
	});

	it("não inicia timer sem sessão ativa", () => {
		const deps = buildDeps();
		const lifecycle = createSurveyQueueLifecycle(deps);
		lifecycle.handleStoreChange();
		expect(deps.intervals).toHaveLength(0);
	});

	it("inicia timer quando há sessão ativa", () => {
		const deps = buildDeps();
		const lifecycle = createSurveyQueueLifecycle(deps);
		deps.setSessionId("session-1");
		lifecycle.handleStoreChange();
		expect(deps.intervals).toHaveLength(1);
		expect(deps.intervals[0]?.ms).toBe(TICK_MS);
	});

	it("timer executa drain com sessão atual", () => {
		const deps = buildDeps();
		const lifecycle = createSurveyQueueLifecycle(deps);
		deps.setSessionId("session-1");
		lifecycle.handleStoreChange();
		deps.setSessionId("session-2");
		deps.intervals[0]?.callback();
		expect(deps.drain).toHaveBeenCalledWith("session-2");
	});

	it("AppState active drena a fila", () => {
		const deps = buildDeps();
		const lifecycle = createSurveyQueueLifecycle(deps);
		deps.setSessionId("session-1");
		lifecycle.handleAppStateActive();
		expect(deps.drain).toHaveBeenCalledWith("session-1");
	});

	it("reconexão drena a fila", () => {
		const deps = buildDeps();
		const lifecycle = createSurveyQueueLifecycle(deps);
		deps.setSessionId("session-1");
		lifecycle.handleNetInfoConnected(false);
		lifecycle.handleNetInfoConnected(true);
		expect(deps.drain).toHaveBeenCalledWith("session-1");
	});

	it("reconexão repetida não drena duas vezes", () => {
		const deps = buildDeps();
		const lifecycle = createSurveyQueueLifecycle(deps);
		deps.setSessionId("session-1");
		lifecycle.handleNetInfoConnected(true);
		lifecycle.handleNetInfoConnected(true);
		expect(deps.drain).toHaveBeenCalledTimes(1);
	});

	it("suíte encerrada dispara drenagem", () => {
		const deps = buildDeps();
		const lifecycle = createSurveyQueueLifecycle(deps);
		deps.setSessionId("session-1");
		deps.setExecution({ isActive: true, tasksSignature: "T1:pending" });
		lifecycle.handleStoreChange();
		deps.drain.mockClear();
		deps.setExecution({ isActive: false, tasksSignature: "T1:done" });
		lifecycle.handleStoreChange();
		expect(deps.drain).toHaveBeenCalledWith("session-1");
	});

	it("tarefa resolvida dispara drenagem", () => {
		const deps = buildDeps();
		const lifecycle = createSurveyQueueLifecycle(deps);
		deps.setSessionId("session-1");
		deps.setExecution({
			isActive: true,
			tasksSignature: "T1:pending,T2:pending",
		});
		lifecycle.handleStoreChange();
		deps.drain.mockClear();
		deps.setExecution({ isActive: true, tasksSignature: "T1:done,T2:pending" });
		lifecycle.handleStoreChange();
		expect(deps.drain).toHaveBeenCalledWith("session-1");
	});

	it("cleanup para o timer", () => {
		const deps = buildDeps();
		const lifecycle = createSurveyQueueLifecycle(deps);
		deps.setSessionId("session-1");
		lifecycle.handleStoreChange();
		lifecycle.cleanup();
		expect(deps.clearInterval).toHaveBeenCalled();
	});
});
