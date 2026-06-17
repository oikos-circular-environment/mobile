import { faker } from "@faker-js/faker";
import type { MarketCompany } from "@/libs/types/market";
import type { Measurement } from "@/libs/types/measurement";
import { makeWasteCategory } from "./make-waste-category";

type MarketService = MarketCompany["services"][number];

const SERVICE_MEASUREMENTS: Measurement[] = ["DAY", "KG", "UNIT"];

export function makeService(
	overrides: Partial<MarketService> = {},
): MarketService {
	return {
		id: faker.string.uuid(),
		name: faker.commerce.productName(),
		description: null,
		price: faker.number.float({ min: 20, max: 500, fractionDigits: 2 }),
		unit: faker.helpers.arrayElement(SERVICE_MEASUREMENTS),
		waste_category_id: faker.string.uuid(),
		waste_category: makeWasteCategory(),
		quantity: faker.number.int({ min: 0, max: 100 }),
		observations: null,
		...overrides,
	};
}
