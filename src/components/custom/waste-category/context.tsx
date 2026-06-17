import { createContext, useContext } from "react";
import type { WasteCategory } from "@/libs/types/waste-category";

interface WasteCategoryContextValue {
	categories: WasteCategory[];
	selectionMode: "single" | "multiple";
	selectedWasteCategory: WasteCategory | null;
	selectedWasteCategories: WasteCategory[];
	onSelect: (category: WasteCategory) => void;
}

export const WasteCategoryContext =
	createContext<WasteCategoryContextValue | null>(null);

export function useWasteCategoryContext() {
	const ctx = useContext(WasteCategoryContext);
	if (!ctx)
		throw new Error(
			"useWasteCategoryContext must be used within <WasteCategory>",
		);
	return ctx;
}
