import { z } from "zod";
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

export const wasteManagementFormSchema = z.object({
	name: z.string().min(1, "Nome é obrigatório."),
	description: z.string().max(240, "A descrição deve ter até 240 caracteres."),
	price: z.number().min(0, "O valor não pode ser negativo."),
	unit: z.enum(measurementValues),
	wasteType: z.enum(["RECYCLABLE", "GARBAGE"] as const),
	subItems: z.array(z.string().min(1)).default([]),
});

export type WasteManagementFormInput = z.input<
	typeof wasteManagementFormSchema
>;
export type WasteManagementFormValues = z.output<
	typeof wasteManagementFormSchema
>;
