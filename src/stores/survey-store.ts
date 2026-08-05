import { create } from "zustand";

type SurveyStatus = "IDLE" | "IN_PROGRESS" | "COMPLETED" | "ABANDONED";

type SurveyState = {
	sessionId: string | null;
	persona: string | null;
	participantCode: string | null;
	status: SurveyStatus;
	currentSuiteCode: string | null;
	currentTaskCode: string | null;
	activeMs: number;
	wallMs: number;
	hasPendingSync: boolean;
	/** Aceite do termo (F2.5), guardado até a sessão local ser criada em E2 (M04). */
	consentVersion: string | null;
	consentAt: string | null;
};

type SurveyActions = {
	startSession: (sessionId: string, persona: string) => void;
	setParticipantCode: (code: string) => void;
	setProgress: (suiteCode: string | null, taskCode: string | null) => void;
	addActiveMs: (ms: number) => void;
	addWallMs: (ms: number) => void;
	setStatus: (status: SurveyStatus) => void;
	setPendingSync: (pending: boolean) => void;
	setConsent: (version: string, acceptedAt: string) => void;
	reset: () => void;
};

const INITIAL_STATE: SurveyState = {
	sessionId: null,
	persona: null,
	participantCode: null,
	status: "IDLE",
	currentSuiteCode: null,
	currentTaskCode: null,
	activeMs: 0,
	wallMs: 0,
	hasPendingSync: false,
	consentVersion: null,
	consentAt: null,
};

export const useSurveyStore = create<SurveyState & SurveyActions>(set => ({
	...INITIAL_STATE,

	startSession: (sessionId, persona) =>
		set({ ...INITIAL_STATE, sessionId, persona, status: "IN_PROGRESS" }),

	setParticipantCode: participantCode => set({ participantCode }),

	setProgress: (currentSuiteCode, currentTaskCode) =>
		set({ currentSuiteCode, currentTaskCode }),

	addActiveMs: ms => set(state => ({ activeMs: state.activeMs + ms })),

	addWallMs: ms => set(state => ({ wallMs: state.wallMs + ms })),

	setStatus: status => set({ status }),

	setPendingSync: hasPendingSync => set({ hasPendingSync }),

	setConsent: (consentVersion, consentAt) => set({ consentVersion, consentAt }),

	reset: () => set(INITIAL_STATE),
}));
