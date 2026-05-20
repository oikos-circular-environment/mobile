function onlyDigits(value: string) {
	return value.replace(/\D/g, "");
}

export function maskCpf(value: string) {
	const digits = onlyDigits(value).slice(0, 11);

	return digits
		.replace(/(\d{3})(\d)/, "$1.$2")
		.replace(/(\d{3})(\d)/, "$1.$2")
		.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function maskCnpj(value: string) {
	const digits = onlyDigits(value).slice(0, 14);

	return digits
		.replace(/(\d{2})(\d)/, "$1.$2")
		.replace(/(\d{3})(\d)/, "$1.$2")
		.replace(/(\d{3})(\d)/, "$1/$2")
		.replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

export function maskCep(value: string) {
	const digits = onlyDigits(value).slice(0, 8);

	return digits.replace(/(\d{5})(\d{1,3})$/, "$1-$2");
}

export function maskPhoneBr(value: string) {
	const digits = onlyDigits(value).slice(0, 11);

	if (digits.length <= 10) {
		return digits
			.replace(/(\d{2})(\d)/, "($1) $2")
			.replace(/(\d{4})(\d{1,4})$/, "$1-$2");
	}

	return digits
		.replace(/(\d{2})(\d)/, "($1) $2")
		.replace(/(\d{1})(\d{4})(\d{1,4})$/, "$1 $2-$3");
}

export function maskPrice(value: string) {
	const cleaned = value.replace(/[^\d,]/g, "");
	const commaIdx = cleaned.indexOf(",");
	if (commaIdx === -1) return cleaned;
	return (
		cleaned.slice(0, commaIdx + 1) +
		cleaned
			.slice(commaIdx + 1)
			.replace(/,/g, "")
			.slice(0, 2)
	);
}

export function maskDecimal(value: string) {
	const cleaned = value.replace(/[^\d,]/g, "");
	const commaIdx = cleaned.indexOf(",");
	if (commaIdx === -1) return cleaned;
	return (
		cleaned.slice(0, commaIdx + 1) +
		cleaned
			.slice(commaIdx + 1)
			.replace(/,/g, "")
			.slice(0, 3)
	);
}

export function formatDecimal(value: number) {
	return String(value).replace(".", ",");
}

export function parseDecimalInput(value: string | number) {
	if (typeof value === "number") return value;
	const cleaned = value.replace(/[^\d,]/g, "").replace(",", ".");
	const parsed = Number(cleaned);
	return Number.isNaN(parsed) ? 0 : parsed;
}

export const mask = {
	cpf: maskCpf,
	cnpj: maskCnpj,
	cep: maskCep,
	phoneBr: maskPhoneBr,
	price: maskPrice,
	decimal: maskDecimal,
	formatDecimal,
	parseDecimal: parseDecimalInput,
};
