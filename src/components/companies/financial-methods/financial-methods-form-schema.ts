import { z } from "zod";

export const financialMethodSchema = z.object({
	id: z.string(),
	active: z.boolean(),
	type: z.enum(["PAYMENT", "RECEIPT"] as const),
	financial_means: z.enum([
		"CREDIT_CARD",
		"DEBIT_CARD",
		"CASH",
		"PIX",
		"BANK_SLIP",
	] as const),
	name: z.string().min(1, "Nome é obrigatório"),
	flags: z
		.array(
			z.enum([
				"VISA",
				"MASTERCARD",
				"AMEX",
				"ELO",
				"HIPERCARD",
				"OUTRO",
			] as const),
		)
		.nullable(),
	observations: z.string().optional(),
});

export const financialMethodsFormSchema = z.object({
	methods: z.array(financialMethodSchema),
});

export type FinancialMethodFormValues = z.infer<typeof financialMethodSchema>;
export type FinancialMethodsFormValues = z.infer<
	typeof financialMethodsFormSchema
>;
