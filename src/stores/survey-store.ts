import { create } from "zustand";

type SurveyStatus = "IDLE" | "IN_PROGRESS" | "COMPLETED" | "ABANDONED";

type SurveyState = {
	sessionId: string | null;
	participantCode: string | null;
	status: SurveyStatus;
	currentSuiteCode: string | null;
	currentTaskCode: string | null;
	activeMs: number;
	wallMs: number;
	hasPendingSync: boolean;
};

type SurveyActions = {
	startSession: (sessionId: string) => void;
	setParticipantCode: (code: string) => void;
	setProgress: (suiteCode: string | null, taskCode: string | null) => void;
	addActiveMs: (ms: number) => void;
	addWallMs: (ms: number) => void;
	setStatus: (status: SurveyStatus) => void;
	setPendingSync: (pending: boolean) => void;
	reset: () => void;
};

const INITIAL_STATE: SurveyState = {
	sessionId: null,
	participantCode: null,
	status: "IDLE",
	currentSuiteCode: null,
	currentTaskCode: null,
	activeMs: 0,
	wallMs: 0,
	hasPendingSync: false,
};

export const useSurveyStore = create<SurveyState & SurveyActions>(set => ({
	...INITIAL_STATE,

	startSession: sessionId =>
		set({ ...INITIAL_STATE, sessionId, status: "IN_PROGRESS" }),

	setParticipantCode: participantCode => set({ participantCode }),

	setProgress: (currentSuiteCode, currentTaskCode) =>
		set({ currentSuiteCode, currentTaskCode }),

	addActiveMs: ms => set(state => ({ activeMs: state.activeMs + ms })),

	addWallMs: ms => set(state => ({ wallMs: state.wallMs + ms })),

	setStatus: status => set({ status }),

	setPendingSync: hasPendingSync => set({ hasPendingSync }),

	reset: () => set(INITIAL_STATE),
}));
