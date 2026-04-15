import { headingToCompass } from "./heading-to-compass";

/**
 * Formata heading em graus e, opcionalmente, inclui direcao cardinal.
 *
 * Entrada: 32.74731063
 * Saida (padrao): "32.7 graus"
 * Saida (com direcao): "32.7 graus (NNE - Norte-Nordeste)"
 */
export function formatHeading(
  value: number | null | undefined,
  options?: { includeCompass?: boolean },
) {
  if (value == null || Number.isNaN(value) || value < 0) {
    return "indisponivel";
  }

  if (!options?.includeCompass) {
    return `${value.toFixed(1)}º`;
  }

  const compass = headingToCompass(value);
  if (compass == null) {
    return `${value.toFixed(1)}º`;
  }

  return `${value.toFixed(1)}º (${compass.abbreviation} - ${compass.labelPtBr})`;
}
