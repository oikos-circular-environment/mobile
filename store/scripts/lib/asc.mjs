/**
 * @file Acesso à App Store Connect: cliente do SDK, retry e as regras de estado
 *   que a API não modela.
 * @see docs/publishing-path.md — "Envio para o App Review"
 */

import {
	APP_STORE_CONNECT_BASE_URL,
	AppVersionState,
	createAscClient,
	readAscCredentialsFromEnv,
} from "@oikos-circular-environment/apple-connect-api";
import { RETRYABLE_STATUS, withRetry } from "./http-retry.mjs";

const DEFAULT_APP_ID = "6786017565";

/**
 * Estados de App Store Version que não aceitam mais um novo build. Inclui os de
 * review em andamento, em que a Apple recusa trocar o build anexado. `REJECTED`
 * e `DEVELOPER_REJECTED` não entram: neles a versão volta a ser editável.
 *
 * @type {ReadonlySet<string>}
 */
export const NON_EDITABLE_VERSION_STATES = new Set([
	AppVersionState.READY_FOR_DISTRIBUTION,
	AppVersionState.PENDING_DEVELOPER_RELEASE,
	AppVersionState.PENDING_APPLE_RELEASE,
	AppVersionState.PROCESSING_FOR_DISTRIBUTION,
	AppVersionState.REPLACED_WITH_NEW_VERSION,
	AppVersionState.WAITING_FOR_REVIEW,
	AppVersionState.IN_REVIEW,
]);

/**
 * Estados de Review Submission seguros para reaproveitar: dá pra adicionar item
 * e marcar `submitted: true` sem conflitar com o que a Apple está fazendo.
 *
 * @type {ReadonlyArray<string>}
 */
const REUSABLE_REVIEW_SUBMISSION_STATES = [
	"READY_FOR_REVIEW",
	"WAITING_FOR_REVIEW",
	"IN_REVIEW",
	"UNRESOLVED_ISSUES",
];

/**
 * Estados de transição: a submission está sendo cancelada ou finalizada pela
 * Apple. Mexer nela agora — adicionar item, marcar `submitted: true` — é
 * inseguro; a única opção é esperar terminar.
 *
 * @type {ReadonlyArray<string>}
 */
export const TRANSITIONING_REVIEW_SUBMISSION_STATES = [
	"CANCELING",
	"COMPLETING",
];

/** União das duas listas, para o filtro que busca qualquer submission em curso. */
export const OPEN_REVIEW_SUBMISSION_STATES = [
	...REUSABLE_REVIEW_SUBMISSION_STATES,
	...TRANSITIONING_REVIEW_SUBMISSION_STATES,
];

/**
 * Erro de resposta da App Store Connect, com os `errors` da Apple formatados na
 * mensagem.
 *
 * @property {number} status Código HTTP da resposta.
 * @property {object} body Corpo da resposta, no formato de erro do JSON:API.
 */
export class AscApiError extends Error {
	/**
	 * @param {number} status
	 * @param {object} body
	 * @param {string} operation
	 */
	constructor(status, body, operation) {
		const details = (body?.errors ?? [])
			.map(error => {
				const pointer = error.source?.pointer ?? error.source?.parameter;
				const where = pointer ? ` (${pointer})` : "";
				return `  · ${error.title}: ${error.detail}${where}`;
			})
			.join("\n");

		super(
			`App Store Connect respondeu ${status} em ${operation}` +
				(details ? `\n${details}` : `\n  ${JSON.stringify(body)}`),
		);
		this.name = "AscApiError";
		this.status = status;
		this.body = body;
	}
}

/**
 * Lê as credenciais do ambiente e monta o cliente do SDK, que renova o JWT
 * sozinho — o TTL de 20 minutos é menor que uma espera por processamento de
 * build.
 *
 * @returns {{ appId: string, client: ReturnType<createAscClient> }}
 */
export function createAsc() {
	const credentials = readAscCredentialsFromEnv();
	return {
		appId: credentials.appId ?? DEFAULT_APP_ID,
		client: createAscClient(credentials, {
			baseUrl: APP_STORE_CONNECT_BASE_URL,
		}),
	};
}

/**
 * Executa uma operação do SDK, convertendo a resposta de erro em `AscApiError`
 * e repetindo em 429/5xx. O SDK devolve `{ data, error, response }` em vez de
 * lançar, e é do `response` que vem o status que decide o retry.
 *
 * @template T
 * @param {(options: object) => Promise<{ data?: T, error?: object, response: Response }>} operation
 * @param {object} [options] Opções da operação (`path`, `query`, `body`, `client`).
 * @returns {Promise<T>}
 * @throws {AscApiError} Fora da faixa 2xx, após esgotar as tentativas.
 */
export function ascCall(operation, options = {}) {
	const name = operation.name || "operação";

	return withRetry(
		async () => {
			const { data, error, response } = await operation(options);
			if (error !== undefined) {
				throw new AscApiError(response.status, error, name);
			}
			return data;
		},
		{
			isRetryable: error =>
				error instanceof AscApiError && RETRYABLE_STATUS.has(error.status),
			onRetry: (_error, attemptNumber, delayMs) =>
				console.warn(
					`  ↻ ${name} falhou, tentando de novo em ${delayMs}ms (tentativa ${attemptNumber + 1})`,
				),
		},
	);
}

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
export function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}
