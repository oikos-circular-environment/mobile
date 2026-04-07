/**
 * Formata velocidade em m/s e km/h.
 *
 * Entrada: 3.5
 * Saida: "3.50 m/s (12.6 km/h)"
 */
export function formatSpeed(value: number | null | undefined) {
  if (value == null || Number.isNaN(value) || value < 0) {
    return "indisponivel";
  }

  return `${value.toFixed(2)} m/s (${(value * 3.6).toFixed(1)} km/h)`;
}
