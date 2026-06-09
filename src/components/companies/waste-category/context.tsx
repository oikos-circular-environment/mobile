import { createContext, useContext } from "react";
import type { WasteCategory } from "@/components/companies/hooks/use-waste-categories";

interface WasteCategoryContextValue {
	categories: WasteCategory[];
	selectedWasteCategory: WasteCategory | null;
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
