import type { HazardLevelVariant } from "@/components/custom/waste-category/waste-category-hazard-level";

type AddressableComplaint = {
	geospatial: {
		addresses: {
			street?: string | null;
			streetNumber?: string | null;
			district?: string | null;
		};
	};
};

const HAZARD_PRIORITY: Record<string, number> = {
	LOW: 1,
	MEDIUM: 2,
	HIGH: 3,
	VERY_HIGH: 4,
};

const HAZARD_VARIANT: Record<string, HazardLevelVariant> = {
	LOW: "low",
	MEDIUM: "medium",
	HIGH: "high",
	VERY_HIGH: "very_high",
};

export function highestHazardVariant(levels: string[]): HazardLevelVariant {
	const highest = levels.reduce(
		(max, lvl) =>
			(HAZARD_PRIORITY[lvl] ?? 0) > (HAZARD_PRIORITY[max] ?? 0) ? lvl : max,
		levels[0] ?? "LOW",
	);
	return HAZARD_VARIANT[highest] ?? "low";
}

export function deriveAddress(complaint: AddressableComplaint): string | null {
	const { addresses } = complaint.geospatial;
	const streetPart = [addresses.street, addresses.streetNumber]
		.filter(Boolean)
		.join(", ");
	return [streetPart, addresses.district].filter(Boolean).join(" — ") || null;
}
