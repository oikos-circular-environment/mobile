/**
 * Formata um valor em metros para exibicao humana.
 *
 * Entrada: 7.636
 * Saida: "7.6 metros"
 */
export function formatMeters(value: number | null | undefined) {
  if (value == null || Number.isNaN(value) || value < 0) {
    return "indisponivel";
  }

  return `${value.toFixed(1)} metros`;
}
