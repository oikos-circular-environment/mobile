import { decimalToSexagesimal } from "geolib";

/**
 * Formata latitude/longitude em coordenada sexagesimal com hemisferio.
 *
 * Entrada: (-16.48555969, "latitude")
 * Saida: "16° 29' 8\" S"
 */
export function formatSexagesimalCoordinate(
	value: number | null | undefined,
	axis: "latitude" | "longitude",
) {
	if (value == null || Number.isNaN(value)) {
		return "indisponivel";
	}

	const hemisphere =
		axis === "latitude" ? (value < 0 ? "S" : "N") : value < 0 ? "W" : "E";

	const sexagesimalValue = decimalToSexagesimal(Math.abs(value));
	return `${sexagesimalValue} ${hemisphere}`;
}
