import { create } from "zustand";

/**
 * Estado transitório entre a escolha de persona (F3.7) e a criação da sessão local
 * (feita só ao fim de F3.8g, quando persona + toda a caracterização já existem — a
 * linha de `survey_session` exige todos os campos de uma vez). Zerado após a sessão
 * ser criada.
 */
type SurveyDraftState = {
	persona: string | null;
	stateUf: string | null;
	cityName: string | null;
	ageRange: string | null;
	educationLevel: string | null;
	chainRole: string | null;
	wasteContactFrequency: number | null;
	appExperience: number | null;
};

type SurveyDraftActions = {
	setPersona: (persona: string) => void;
	setScreenerAnswer: <K extends keyof SurveyDraftState>(
		key: K,
		value: SurveyDraftState[K],
	) => void;
	reset: () => void;
};

const INITIAL_STATE: SurveyDraftState = {
	persona: null,
	stateUf: null,
	cityName: null,
	ageRange: null,
	educationLevel: null,
	chainRole: null,
	wasteContactFrequency: null,
	appExperience: null,
};

export const useSurveyDraftStore = create<
	SurveyDraftState & SurveyDraftActions
>(set => ({
	...INITIAL_STATE,

	setPersona: persona => set({ persona }),

	setScreenerAnswer: (key, value) => set({ [key]: value }),

	reset: () => set(INITIAL_STATE),
}));
