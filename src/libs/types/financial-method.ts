import type { ValueMapping } from "./value-mapping";

export type FinancialMethodType =
  | "CREDIT_CARD"
  | "DEBIT_CARD"
  | "CASH"
  | "PIX"
  | "OTHER";

export const FinancialMethodTypes: ValueMapping<FinancialMethodType>[] = [
  { value: "CREDIT_CARD", label: "Cartão de Crédito" },
  { value: "DEBIT_CARD", label: "Cartão de Débito" },
  { value: "CASH", label: "Dinheiro" },
  { value: "PIX", label: "PIX" },
];

export type FinancialMethodFlag =
  | "VISA"
  | "MASTERCARD"
  | "AMEX"
  | "ELO"
  | "HIPERCARD"
  | "OUTRO"
  | null;

export const FinancialMethodFlags: ValueMapping<FinancialMethodFlag>[] = [
  { value: "VISA", label: "Visa" },
  { value: "MASTERCARD", label: "Mastercard" },
  { value: "AMEX", label: "American Express" },
  { value: "ELO", label: "Elo" },
  { value: "HIPERCARD", label: "Hipercard" },
  { value: "OUTRO", label: "Outro" },
  { value: null, label: "Nenhuma bandeira" },
];

type FinancialMethod = {
  id: string;
  type: FinancialMethodType;
  name: string;
  flags: FinancialMethodFlag[];
};

export type Payment = FinancialMethod;
export type Receipt = FinancialMethod;
