import { convertSpeed } from "geolib";

/**
 * Formata velocidade em m/s e km/h.
 *
 * Entrada: 3.5
 * Saida: "12.6 km/h (3.50 m/s)"
 */
export function formatSpeed(value: number | null | undefined) {
	if (value == null || Number.isNaN(value) || value < 0) {
		return "indisponivel";
	}

	return `${convertSpeed(value, "kmh").toFixed(1)} km/h (${value.toFixed(2)} m/s)`;
}
