import type { ValueMapping } from "./value-mapping";

export type FinancialMeans =
	| "CREDIT_CARD"
	| "DEBIT_CARD"
	| "CASH"
	| "PIX"
	| "BANK_SLIP";

export const financialMeansOptions: ValueMapping<FinancialMeans>[] = [
	{ value: "CREDIT_CARD", label: "Cartão de Crédito" },
	{ value: "DEBIT_CARD", label: "Cartão de Débito" },
	{ value: "CASH", label: "Dinheiro" },
	{ value: "PIX", label: "PIX" },
	{ value: "BANK_SLIP", label: "Boleto Bancário" },
];

export type FinancialFlag =
	| "VISA"
	| "MASTERCARD"
	| "AMEX"
	| "ELO"
	| "HIPERCARD"
	| "OUTRO"
	| "ALL";

export const financialFlagsOptions: ValueMapping<FinancialFlag>[] = [
	{ value: "VISA", label: "Visa" },
	{ value: "MASTERCARD", label: "Mastercard" },
	{ value: "AMEX", label: "American Express" },
	{ value: "ELO", label: "Elo" },
	{ value: "HIPERCARD", label: "Hipercard" },
	{ value: "OUTRO", label: "Outro" },
	{ value: "ALL", label: "Todas as bandeiras" },
];

export type FinancialType = "PAYMENT" | "RECEIPT";

export const financialTypeOptions: ValueMapping<FinancialType>[] = [
	{ value: "PAYMENT", label: "Pagamento" },
	{ value: "RECEIPT", label: "Recebimento" },
];

export type Financial = {
	id: string;
	active: boolean;
	type: FinancialType;
	financial_means: FinancialMeans;
	name: string;
	observations?: string;
	flags: FinancialFlag[] | null;
};

export const companyFinancial: Financial[] = [
	{
		id: "001fec4d-3892-4907-884b-bee65cdeea40",
		active: true,
		type: "PAYMENT",
		financial_means: "CREDIT_CARD",
		name: "Cartão de Crédito",
		flags: ["VISA", "MASTERCARD"],
	},
	{
		id: "002fec4d-3892-4907-884b-bee65cdeea40",
		active: true,
		type: "PAYMENT",
		financial_means: "DEBIT_CARD",
		name: "Cartão de Débito",
		flags: ["VISA", "MASTERCARD", "ELO"],
	},
	{
		id: "003fec4d-3892-4907-884b-bee65cdeea40",
		active: true,
		type: "PAYMENT",
		financial_means: "CASH",
		name: "Dinheiro",
		flags: null,
	},
	{
		id: "004fec4d-3892-4907-884b-bee65cdeea40",
		active: true,
		type: "PAYMENT",
		financial_means: "PIX",
		name: "PIX",
		flags: null,
	},
	{
		id: "005fec4d-3892-4907-884b-bee65cdeea40",
		active: true,
		type: "PAYMENT",
		financial_means: "BANK_SLIP",
		name: "Boleto Bancário",
		observations: "Emitir com vencimento para 10 dias após a compra",
		flags: null,
	},
	{
		id: "006fec4d-3892-4907-884b-bee65cdeea40",
		active: true,
		type: "RECEIPT",
		financial_means: "CREDIT_CARD",
		name: "Cartão de Crédito",
		flags: ["VISA", "MASTERCARD"],
	},
	{
		id: "007fec4d-3892-4907-884b-bee65cdeea40",
		active: true,
		type: "RECEIPT",
		financial_means: "DEBIT_CARD",
		name: "Cartão de Débito",
		flags: ["VISA", "MASTERCARD", "ELO"],
	},
	{
		id: "008fec4d-3892-4907-884b-bee65cdeea40",
		active: true,
		type: "RECEIPT",
		financial_means: "CASH",
		name: "Dinheiro",
		flags: null,
	},
	{
		id: "009fec4d-3892-4907-884b-bee65cdeea40",
		active: true,
		type: "RECEIPT",
		financial_means: "PIX",
		name: "PIX",
		flags: null,
	},
	{
		id: "010fec4d-3892-4907-884b-bee65cdeea40",
		active: true,
		type: "RECEIPT",
		financial_means: "BANK_SLIP",
		name: "Boleto Bancário",
		flags: null,
	},
];
