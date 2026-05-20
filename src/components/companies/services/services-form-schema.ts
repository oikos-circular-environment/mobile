import { z } from "zod";
import { parseDecimalInput } from "@/libs/mask";
import type { Measurement } from "@/libs/types/measurement";

const measurementValues = [
	"KG",
	"L",
	"UNIT",
	"M",
	"M2",
	"M3",
	"ML",
] as const satisfies readonly [Measurement, ...Measurement[]];

export const serviceFormSchema = z.object({
	name: z.string().min(1, "Nome é obrigatório."),
	description: z.string().max(240, "A descrição deve ter até 240 caracteres."),
	price: z
		.union([z.string(), z.number()])
		.transform(parseDecimalInput)
		.pipe(z.number().min(0, "O valor não pode ser negativo.")),
	quantity: z
		.union([z.string(), z.number()])
		.transform(parseDecimalInput)
		.pipe(z.number().min(0.001, "Informe uma quantidade maior que zero.")),
	unit: z.enum(measurementValues),
	wasteType: z.enum(["RECYCLABLE", "GARBAGE"] as const),
	subItems: z.array(z.string().min(1)).default([]),
	observations: z
		.string()
		.max(500, "As observações devem ter até 500 caracteres."),
});

export type ServiceFormInput = z.input<typeof serviceFormSchema>;
export type ServiceFormValues = z.output<typeof serviceFormSchema>;
