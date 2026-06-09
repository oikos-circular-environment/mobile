import type { Measurement } from "./measurement";

export type Item = {
	id: string;
	name: string;
	description: string | null;
	price: number;
	unit: Measurement;
	quantity: number;
	observations: string | null;
	waste_category_id: string;
};
