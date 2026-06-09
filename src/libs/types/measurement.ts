import type { ValueMapping } from "./value-mapping";

export type Measurement =
	| "KG"
	| "L"
	| "UNIT"
	| "M"
	| "M2"
	| "M3"
	| "ML"
	| "DAY";

export const measurements: ValueMapping<Measurement>[] = [
	{ value: "DAY", label: "Diária" },
	{ value: "KG", label: "Quilograma" },
	{ value: "L", label: "Litro" },
	{ value: "UNIT", label: "Unidade" },
	{ value: "M", label: "Metro" },
	{ value: "M2", label: "Metro Quadrado" },
	{ value: "M3", label: "Metro Cúbico" },
	{ value: "ML", label: "Metro Linear" },
];
