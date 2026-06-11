import { faker } from "@faker-js/faker";
import type { MarketCompany } from "@/libs/types/market";
import type { Measurement } from "@/libs/types/measurement";
import { makeWasteCategory } from "./make-waste-category";

type MarketWaste = MarketCompany["wastes"][number];

const MEASUREMENTS: Measurement[] = [
	"KG",
	"L",
	"UNIT",
	"M",
	"M2",
	"M3",
	"ML",
	"DAY",
];

export function makeWaste(overrides: Partial<MarketWaste> = {}): MarketWaste {
	return {
		id: faker.string.uuid(),
		name: faker.commerce.productName(),
		description: null,
		price: faker.number.float({ min: 0, max: 10, fractionDigits: 2 }),
		unit: faker.helpers.arrayElement(MEASUREMENTS),
		waste_category_id: faker.string.uuid(),
		waste_category: makeWasteCategory(),
		quantity: faker.number.int({ min: 0, max: 1000 }),
		observations: null,
		...overrides,
	};
}
