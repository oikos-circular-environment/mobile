import { computeDestinationPoint, getCompassDirection } from "geolib";

export type HeadingToCompassResult = {
	degrees: number;
	abbreviation: string;
	labelPtBr: string;
};

const COMPASS_LABELS_PT_BR: Record<string, string> = {
	N: "Norte",
	NNE: "Norte-Nordeste",
	NE: "Nordeste",
	ENE: "Leste-Nordeste",
	E: "Leste",
	ESE: "Leste-Sudeste",
	SE: "Sudeste",
	SSE: "Sul-Sudeste",
	S: "Sul",
	SSW: "Sul-Sudoeste",
	SW: "Sudoeste",
	WSW: "Oeste-Sudoeste",
	W: "Oeste",
	WNW: "Oeste-Noroeste",
	NW: "Noroeste",
	NNW: "Norte-Noroeste",
};

/**
 * Converte um heading (graus) para direcao cardinal/intercardinal.
 *
 * Entrada: 32.74731063
 * Saida: { degrees: 32.74731063, abbreviation: "NNE", labelPtBr: "Norte-Nordeste" }
 */
export function headingToCompass(
	value: number | null | undefined,
): HeadingToCompassResult | null {
	if (value == null || Number.isNaN(value) || value < 0) {
		return null;
	}

	const degrees = ((value % 360) + 360) % 360;
	const origin = { latitude: 0, longitude: 0 };
	const destination = computeDestinationPoint(origin, 100, degrees);
	const abbreviation = getCompassDirection(origin, destination);

	return {
		degrees,
		abbreviation,
		labelPtBr: COMPASS_LABELS_PT_BR[abbreviation] ?? abbreviation,
	};
}
