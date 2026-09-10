import type { HazardLevelVariant } from "@/components/custom/waste-category";
import type { WasteCategory } from "@/libs/types/waste-category";

export const RADIUS_OPTIONS = [
	{ label: "2 km", value: 2000 },
	{ label: "5 km", value: 5000 },
	{ label: "10 km", value: 10000 },
	{ label: "15 km", value: 15000 },
	{ label: "20 km", value: 20000 },
	{ label: "30 km", value: 30000 },
	{ label: "40 km", value: 40000 },
];

export type FilterState = {
	status: "ALL" | "OPEN" | "RESOLVED";
	category: WasteCategory | null;
	hazardLevel: "all" | HazardLevelVariant;
	radius: number;
};

export const DEFAULT_FILTERS: FilterState = {
	status: "OPEN",
	category: null,
	hazardLevel: "all",
	radius: 2000,
};

export type BottomSheetRef = {
	open: () => void;
	close: () => void;
	snapToIndex: (index: number) => void;
	expand: () => void;
	collapse: () => void;
};
