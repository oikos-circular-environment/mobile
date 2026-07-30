import { create } from "zustand";

export type TaskStatus = "done" | "current" | "pending";

interface ExecutionTask {
	code: string;
	title: string;
	instruction: string;
	status: TaskStatus;
}

type SurveyExecutionState = {
	/** Roteiro inteiro da persona escolhida, na ordem do protocolo. */
	suiteQueue: string[];
	suiteIndex: number;
	suiteCode: string | null;
	suiteTitle: string | null;
	suiteObjective: string | null;
	tasks: ExecutionTask[];
	currentTaskIndex: number;
	/** `true` só depois de "Começar" em F4.10 — antes disso o indicador não aparece. */
	isActive: boolean;
	isExpanded: boolean;
	isPaused: boolean;
	suiteActiveMs: number;
};

type SurveyExecutionActions = {
	initRoteiro: (suiteCodes: string[]) => void;
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
	completeCurrentTask: () => void;
	finishSuite: () => void;
	reset: () => void;
};

const INITIAL_STATE: SurveyExecutionState = {
	suiteQueue: [],
	suiteIndex: 0,
	suiteCode: null,
	suiteTitle: null,
	suiteObjective: null,
	tasks: [],
	currentTaskIndex: 0,
	isActive: false,
	isExpanded: false,
	isPaused: false,
	suiteActiveMs: 0,
};

export const useSurveyExecutionStore = create<
	SurveyExecutionState & SurveyExecutionActions
>((set, get) => ({
	...INITIAL_STATE,

	initRoteiro: suiteCodes => set({ suiteQueue: suiteCodes, suiteIndex: 0 }),

	openSuiteIntro: suite =>
		set({
			suiteCode: suite.code,
			suiteTitle: suite.title,
			suiteObjective: suite.objective,
			tasks: suite.tasks.map((task, index) => ({
				...task,
				status: index === 0 ? "current" : "pending",
			})),
			currentTaskIndex: 0,
			suiteActiveMs: 0,
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
		const nextIndex = state.currentTaskIndex + 1;
		const tasks = state.tasks.map((task, index) => {
			if (index === state.currentTaskIndex)
				return { ...task, status: "done" as const };
			if (index === nextIndex) return { ...task, status: "current" as const };
			return task;
		});
		set({ tasks, currentTaskIndex: Math.min(nextIndex, state.tasks.length) });
	},

	finishSuite: () =>
		set(state => ({ suiteIndex: state.suiteIndex + 1, isActive: false })),

	reset: () => set(INITIAL_STATE),
}));
