import { create } from "zustand";

export type TaskStatus =
	| "done"
	| "current"
	| "pending"
	| "skipped"
	| "abandoned";

export interface ExecutionTask {
	code: string;
	title: string;
	instruction: string;
	status: TaskStatus;
	/** Índice original do protocolo — imutável, nunca muda com "Pular". É o valor gravado
	 *  como `position` no SQLite e enviado no payload de checkpoint; o índice de exibição
	 *  (posição em `tasks`) passa a ser mutável assim que uma tarefa é pulada. */
	position: number;
	/** Metadado de conveniência pra UI — a fonte de verdade do outcome enviado ao servidor
	 *  continua sendo a linha `survey_task_run` no SQLite, não este campo. */
	outcome?: "YES" | "NO";
}

type SurveyExecutionState = {
	/** Roteiro inteiro da persona escolhida, na ordem do protocolo. */
	suiteQueue: string[];
	suiteIndex: number;
	suiteCode: string | null;
	suiteRunId: string | null;
	suiteTitle: string | null;
	suiteObjective: string | null;
	tasks: ExecutionTask[];
	currentTaskIndex: number;
	/** `true` só depois de "Começar" em F4.10 — antes disso o indicador não aparece. */
	isActive: boolean;
	isExpanded: boolean;
	isPaused: boolean;
	suiteActiveMs: number;
	/** Setado só pelo botão "Abandonar etapa" — força o outcome da suíte a NO
	 *  independente da contagem de tarefas concluídas. */
	suiteOutcomeOverride: "NO" | null;
};

type SurveyExecutionActions = {
	initRoteiro: (suiteCodes: string[]) => void;
	setSuiteRunId: (id: string) => void;
	openSuiteIntro: (suite: {
		code: string;
		title: string;
		objective: string;
		tasks: { code: string; title: string; instruction: string }[];
	}) => void;
	beginSuite: () => void;
	setExpanded: (expanded: boolean) => void;
	setPaused: (paused: boolean) => void;
	addActiveMs: (ms: number) => void;
	/** Chamada só pelo watcher de detecção automática — outcome sempre "YES". */
	completeCurrentTask: () => void;
	/** Botão "Pular" da tarefa atual — manda pro fim da fila, pode ser pulada de novo. */
	skipCurrentTask: () => void;
	/** Botão "Abandonar" da tarefa atual — outcome "NO" definitivo (terminal). */
	abandonCurrentTask: () => void;
	/** Botão "Abandonar etapa" — resolve toda tarefa não-terminal como abandonada/NO e
	 *  força o outcome da suíte. */
	abandonSuite: () => void;
	finishSuite: () => void;
	reset: () => void;
};

const INITIAL_STATE: SurveyExecutionState = {
	suiteQueue: [],
	suiteIndex: 0,
	suiteCode: null,
	suiteRunId: null,
	suiteTitle: null,
	suiteObjective: null,
	tasks: [],
	currentTaskIndex: 0,
	isActive: false,
	isExpanded: false,
	isPaused: false,
	suiteActiveMs: 0,
	suiteOutcomeOverride: null,
};

/** A partir de `fromIndex` (inclusive), acha a próxima tarefa "pending" ou "skipped" e a
 *  marca como "current". Se não achar nenhuma, não há mais tarefa atual — `currentTaskIndex`
 *  aponta pro fim do array (sentinela de "nada em aberto"). */
function activateNextTask(
	tasks: ExecutionTask[],
	fromIndex: number,
): { tasks: ExecutionTask[]; currentTaskIndex: number } {
	const idx = tasks.findIndex(
		(t, i) =>
			i >= fromIndex && (t.status === "pending" || t.status === "skipped"),
	);
	if (idx === -1) return { tasks, currentTaskIndex: tasks.length };
	const next = tasks.map((t, i) =>
		i === idx ? { ...t, status: "current" as const } : t,
	);
	return { tasks: next, currentTaskIndex: idx };
}

export const useSurveyExecutionStore = create<
	SurveyExecutionState & SurveyExecutionActions
>((set, get) => ({
	...INITIAL_STATE,

	initRoteiro: suiteCodes => set({ suiteQueue: suiteCodes, suiteIndex: 0 }),

	setSuiteRunId: suiteRunId => set({ suiteRunId }),

	openSuiteIntro: suite =>
		set({
			suiteCode: suite.code,
			suiteTitle: suite.title,
			suiteObjective: suite.objective,
			tasks: suite.tasks.map((task, index) => ({
				...task,
				status: index === 0 ? "current" : "pending",
				position: index,
			})),
			currentTaskIndex: 0,
			suiteActiveMs: 0,
			suiteOutcomeOverride: null,
			isActive: false,
			isExpanded: false,
			isPaused: false,
		}),

	beginSuite: () => set({ isActive: true }),

	setExpanded: isExpanded => set({ isExpanded }),

	setPaused: isPaused => set({ isPaused }),

	addActiveMs: ms =>
		set(state => ({ suiteActiveMs: state.suiteActiveMs + ms })),

	completeCurrentTask: () => {
		const state = get();
		const idx = state.currentTaskIndex;
		if (idx >= state.tasks.length) return;
		const marked = state.tasks.map((t, i) =>
			i === idx
				? { ...t, status: "done" as const, outcome: "YES" as const }
				: t,
		);
		const { tasks, currentTaskIndex } = activateNextTask(marked, idx + 1);
		set({ tasks, currentTaskIndex });
	},

	skipCurrentTask: () => {
		const state = get();
		const idx = state.currentTaskIndex;
		if (idx >= state.tasks.length) return;
		const rest = [...state.tasks];
		const [skipped] = rest.splice(idx, 1);
		if (!skipped) return;
		rest.push({ ...skipped, status: "skipped" as const });
		const { tasks, currentTaskIndex } = activateNextTask(rest, idx);
		set({ tasks, currentTaskIndex });
	},

	abandonCurrentTask: () => {
		const state = get();
		const idx = state.currentTaskIndex;
		if (idx >= state.tasks.length) return;
		const marked = state.tasks.map((t, i) =>
			i === idx
				? { ...t, status: "abandoned" as const, outcome: "NO" as const }
				: t,
		);
		const { tasks, currentTaskIndex } = activateNextTask(marked, idx + 1);
		set({ tasks, currentTaskIndex });
	},

	abandonSuite: () =>
		set(state => ({
			tasks: state.tasks.map(t =>
				t.status === "done" || t.status === "abandoned"
					? t
					: { ...t, status: "abandoned" as const, outcome: "NO" as const },
			),
			currentTaskIndex: state.tasks.length,
			suiteOutcomeOverride: "NO" as const,
		})),

	finishSuite: () =>
		set(state => ({
			suiteIndex: state.suiteIndex + 1,
			isActive: false,
			suiteOutcomeOverride: null,
		})),

	reset: () => set(INITIAL_STATE),
}));

/** 100% das tarefas em estado terminal (done ou abandoned) — "skipped" não conta, ainda
 *  está em aberto. Usado pelo cronômetro (parar de contar) e pelo overlay (auto-expandir +
 *  vibração + toast). */
export const selectAllTasksResolved = (state: SurveyExecutionState) =>
	state.tasks.length > 0 &&
	state.tasks.every(t => t.status === "done" || t.status === "abandoned");

export const selectResolvedTaskCount = (state: SurveyExecutionState) =>
	state.tasks.filter(t => t.status === "done" || t.status === "abandoned")
		.length;
