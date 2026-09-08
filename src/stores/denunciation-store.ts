import { create } from "zustand";
import { sessionBus } from "@/libs/session-bus";
import type { Denunciation } from "@/libs/types/denunciation";

type DenunciationState = {
	denunciations: Denunciation[];
	isLoaded: boolean;
};

type DenunciationActions = {
	setDenunciations: (denunciations: Denunciation[]) => void;
	addDenunciation: (denunciation: Denunciation) => void;
	updateDenunciation: (id: string, patch: Partial<Denunciation>) => void;
};

const INITIAL_STATE: DenunciationState = {
	denunciations: [],
	isLoaded: false,
};

export const useDenunciationStore = create<
	DenunciationState & DenunciationActions
>(set => ({
	...INITIAL_STATE,

	setDenunciations: denunciations => set({ denunciations, isLoaded: true }),

	addDenunciation: denunciation =>
		set(state => ({ denunciations: [denunciation, ...state.denunciations] })),

	updateDenunciation: (id, patch) =>
		set(state => ({
			denunciations: state.denunciations.map(d =>
				d.id === id ? { ...d, ...patch } : d,
			),
		})),
}));

sessionBus.subscribe(() => useDenunciationStore.setState(INITIAL_STATE));
