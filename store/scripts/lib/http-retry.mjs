/**
 * @file Retry com backoff exponencial para 5xx/429 — a App Store Connect e a
 *   Google Play Developer API devolvem esses códigos de forma intermitente
 *   (ex.: o 500 em GET /v1/builds que interrompeu a 1.0.2), e sem retry
 *   qualquer soluço transitório derruba o release inteiro.
 */

export const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const MAX_RETRIES = 4;
const BASE_DELAY_MS = 1000;

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Executa `attempt` até um status não retentável, sucesso, ou esgotar as
 * tentativas. `attempt` deve lançar um erro com `.status` para ser avaliado.
 *
 * @template T
 * @param {(attemptNumber: number) => Promise<T>} attempt
 * @param {{ isRetryable: (error: unknown) => boolean, onRetry?: (error: unknown, attemptNumber: number, delayMs: number) => void }} options
 * @returns {Promise<T>}
 */
export async function withRetry(attempt, { isRetryable, onRetry }) {
	for (let attemptNumber = 0; ; attemptNumber++) {
		try {
			return await attempt(attemptNumber);
		} catch (error) {
			if (attemptNumber >= MAX_RETRIES || !isRetryable(error)) throw error;
			const delayMs = BASE_DELAY_MS * 2 ** attemptNumber;
			onRetry?.(error, attemptNumber, delayMs);
			await sleep(delayMs);
		}
	}
}
