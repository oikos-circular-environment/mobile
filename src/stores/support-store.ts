import { create } from "zustand";
import { sessionBus } from "@/libs/session-bus";
import type { SupportRequest } from "@/libs/types/support";

type SupportState = {
	supports: SupportRequest[];
	isLoaded: boolean;
};

type SupportActions = {
	setSupports: (supports: SupportRequest[]) => void;
	addSupport: (support: SupportRequest) => void;
	updateSupport: (id: string, patch: Partial<SupportRequest>) => void;
};

const INITIAL_STATE: SupportState = {
	supports: [],
	isLoaded: false,
};

export const useSupportStore = create<SupportState & SupportActions>(set => ({
	...INITIAL_STATE,

	setSupports: supports => set({ supports, isLoaded: true }),

	addSupport: support =>
		set(state => ({ supports: [support, ...state.supports] })),

	updateSupport: (id, patch) =>
		set(state => ({
			supports: state.supports.map(s => (s.id === id ? { ...s, ...patch } : s)),
		})),
}));

sessionBus.subscribe(() => useSupportStore.setState(INITIAL_STATE));
