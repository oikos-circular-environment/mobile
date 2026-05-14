import type { Item } from "./item";

//? Serviço pode ser vinculado a uma categoria de resíduo.

export type Service = Item & {
	quantity: number;
	observations: string | null;
};

export const services: Service[] = [
	{
		id: "be66fe22-fbd4-4012-b80a-04669638e65f",
		name: "Coleta de Resíduos de Construção Civil (RCC)",
		description:
			"Serviço de coleta de entulhos, são sobras de obras, reformas, demolições e terraplanagem, como concreto, tijolos, solos, metais e gesso",
		price: 150.0,
		quantity: 3,
		unit: "M3",
		observations:
			"Entulhos descartados que não sejam RCC, será cobrado um valor adicional de R$ 300,00.",
		sub_items: ["concreto", "tijolos", "solos", "metais", "gesso", "ferros"],
		wasteType: "RECYCLABLE",
	},
];
