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

export const mask = {
	cpf: maskCpf,
	cnpj: maskCnpj,
	cep: maskCep,
	phoneBr: maskPhoneBr,
};
