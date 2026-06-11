import { faker } from "@faker-js/faker";
import type { WasteCategory } from "@/libs/types/waste-category";

export function makeWasteCategory(
	overrides: Partial<WasteCategory> = {},
): WasteCategory {
	return {
		id: faker.string.uuid(),
		name: faker.commerce.department(),
		description: null,
		observations: null,
		hazard_levels: faker.helpers.arrayElements<WasteCategory["hazard_levels"][number]>(
			["LOW", "MEDIUM", "HIGH", "VERY_HIGH"],
			{ min: 0, max: 2 },
		),
		created_at: faker.date.past({ years: 1 }),
		updated_at: faker.date.recent(),
		subcategories: [],
		...overrides,
	};
}
