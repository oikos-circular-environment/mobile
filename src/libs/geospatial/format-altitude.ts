export function formatAltitude(value: number | null | undefined) {
	if (value == null || Number.isNaN(value) || value < 0) {
		return "indisponivel";
	}

	return `${value.toFixed(1)} metros`;
}
