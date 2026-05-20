import { type Dinero, dinero, toSnapshot } from "dinero.js";
import { BRL } from "dinero.js/currencies";

export const createMoney = (amount: number) => {
	return dinero({ amount: Math.round(amount), currency: BRL });
};

/**
 * Converte string formatada PT-BR ou número decimal (banco) para valor inteiro (centavos)
 */
export const parseToMinorUnits = (value: string | number): number => {
	if (typeof value === "number") {
		// Garante que 10.5 vire 1050 sem erros de float
		return Math.round(Number(value.toFixed(2)) * 100);
	}

	const cleanValue = value.replace(/\D/g, "");
	return Number(cleanValue) || 0;
};

/**
 * Formata um objeto Dinero para string PT-BR manualmente,
 * já que o v2 removeu o transformer global e o projeto usa v2.
 */
export const formatBRL = (dineroObj: Dinero<number>, showSymbol = true) => {
	const { amount, currency, scale } = toSnapshot(dineroObj);

	// Formata o valor bruto (amount) com base na escala (scale)
	const stringAmount = amount.toString().padStart(scale + 1, "0");
	const intPart = stringAmount
		.slice(0, -scale)
		.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
	const decPart = stringAmount.slice(-scale);

	// ? Mostra a currency, exemplo: BRL, USD
	const symbol = showSymbol ? `${currency.code} ` : "";
	return `${intPart || "0"},${decPart}`;
};

export const moneyUtils = {
	create: createMoney,
	parse: parseToMinorUnits,
	format: formatBRL,
};
