import { faker } from "@faker-js/faker";
import type { MarketCompany } from "@/libs/types/market";

type WasteCategory = MarketCompany["wastes"][number]["waste_category"];
type HazardLevel = "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";

export function makeWasteCategory(
	overrides: Partial<WasteCategory> = {},
): WasteCategory {
	return {
		id: faker.string.uuid(),
		name: faker.commerce.department(),
		hazard_levels: faker.helpers.arrayElements<HazardLevel>(
			["LOW", "MEDIUM", "HIGH", "VERY_HIGH"],
			{ min: 0, max: 2 },
		),
		...overrides,
	};
}
