/**
 * @file Cliente da App Store Connect API: autenticação JWT ES256 e requisições.
 * @see docs/publishing-path.md — "Envio para o App Review"
 */

import { createSign } from "node:crypto";
import { readFileSync } from "node:fs";
import { RETRYABLE_STATUS, withRetry } from "./http-retry.mjs";

const BASE_URL = "https://api.appstoreconnect.apple.com";
const TOKEN_TTL_SECONDS = 19 * 60;

/**
 * Estados de App Store Version que não aceitam mais um novo build. Inclui os de
 * review em andamento, em que a Apple recusa trocar o build anexado. `REJECTED`
 * e `DEVELOPER_REJECTED` não entram: neles a versão volta a ser editável.
 *
 * @type {ReadonlySet<string>}
 */
export const NON_EDITABLE_VERSION_STATES = new Set([
	"READY_FOR_DISTRIBUTION",
	"READY_FOR_SALE",
	"PENDING_DEVELOPER_RELEASE",
	"PENDING_APPLE_RELEASE",
	"PROCESSING_FOR_APP_STORE",
	"REPLACED_WITH_NEW_VERSION",
	"WAITING_FOR_REVIEW",
	"IN_REVIEW",
]);

/**
 * Estados de Review Submission que ainda estão em andamento na Apple.
 *
 * @type {ReadonlyArray<string>}
 */
export const OPEN_REVIEW_SUBMISSION_STATES = [
	"READY_FOR_REVIEW",
	"WAITING_FOR_REVIEW",
	"IN_REVIEW",
	"UNRESOLVED_ISSUES",
];

function base64url(input) {
	return Buffer.from(input)
		.toString("base64")
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
}

function buildJwt({ keyId, issuerId, privateKeyPem }) {
	const header = { alg: "ES256", kid: keyId, typ: "JWT" };
	const now = Math.floor(Date.now() / 1000);
	const payload = {
		iss: issuerId,
		iat: now,
		exp: now + TOKEN_TTL_SECONDS,
		aud: "appstoreconnect-v1",
	};

	const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
	const der = createSign("SHA256")
		.update(signingInput)
		.sign({ key: privateKeyPem, dsaEncoding: "ieee-p1363" });

	return `${signingInput}.${base64url(der)}`;
}

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
	 * @param {{ method: string, path: string }} request
	 */
	constructor(status, body, { method, path }) {
		const details = (body?.errors ?? [])
			.map(error => {
				const pointer = error.source?.pointer ?? error.source?.parameter;
				const where = pointer ? ` (${pointer})` : "";
				return `  · ${error.title}: ${error.detail}${where}`;
			})
			.join("\n");

		super(
			`App Store Connect respondeu ${status} em ${method} ${path}` +
				(details ? `\n${details}` : `\n  ${JSON.stringify(body)}`),
		);
		this.name = "AscApiError";
		this.status = status;
		this.body = body;
	}
}

/**
 * Lê as credenciais da App Store Connect do ambiente. `ASC_API_KEY_P8` contém o
 * caminho do arquivo `.p8`, não seu conteúdo — é como o EAS materializa
 * variáveis de ambiente do tipo `file`.
 *
 * @returns {{ appId: string, keyId: string, issuerId: string, privateKeyPem: string }}
 * @throws {Error} Se alguma das três variáveis não estiver definida.
 */
export function readAscCredentialsFromEnv() {
	const appId = process.env.ASC_APP_ID ?? "6786017565";
	const keyId = process.env.ASC_API_KEY_ID;
	const issuerId = process.env.ASC_API_KEY_ISSUER_ID;
	const p8Path = process.env.ASC_API_KEY_P8;

	if (!keyId || !issuerId || !p8Path) {
		throw new Error(
			"ASC_API_KEY_ID, ASC_API_KEY_ISSUER_ID e ASC_API_KEY_P8 precisam estar configurados no ambiente.",
		);
	}

	return {
		appId,
		keyId,
		issuerId,
		privateKeyPem: readFileSync(p8Path, "utf-8"),
	};
}

/**
 * Cria um cliente da App Store Connect com renovação automática do JWT, cujo
 * TTL máximo é de 20 minutos — menos do que uma espera por processamento de
 * build pode levar.
 *
 * @param {{ keyId: string, issuerId: string, privateKeyPem: string }} credentials
 */
export function createAscClient({ keyId, issuerId, privateKeyPem }) {
	let token = null;
	let tokenExpiresAt = 0;

	/**
	 * Header `Authorization`, com margem de 60s antes do vencimento real para
	 * que nenhuma requisição parta com um token prestes a expirar.
	 *
	 * @returns {string}
	 */
	function authorization() {
		const now = Date.now();
		if (!token || now >= tokenExpiresAt) {
			token = buildJwt({ keyId, issuerId, privateKeyPem });
			tokenExpiresAt = now + (TOKEN_TTL_SECONDS - 60) * 1000;
		}
		return `Bearer ${token}`;
	}

	/**
	 * @param {string} method
	 * @param {string} path Caminho relativo à API ou URL absoluta.
	 * @param {{ query?: Record<string, unknown>, body?: object }} [options]
	 * @throws {AscApiError} Em qualquer resposta fora da faixa 2xx, após
	 *   esgotar as tentativas em caso de 429/5xx.
	 */
	async function request(method, path, { query, body } = {}) {
		const url = new URL(path.startsWith("http") ? path : `${BASE_URL}${path}`);
		for (const [key, value] of Object.entries(query ?? {})) {
			if (value !== undefined && value !== null) {
				url.searchParams.set(key, String(value));
			}
		}

		return withRetry(
			async () => {
				const response = await fetch(url, {
					method,
					headers: {
						Authorization: authorization(),
						...(body ? { "Content-Type": "application/json" } : {}),
					},
					body: body ? JSON.stringify(body) : undefined,
				});

				if (response.status === 204) return null;

				const text = await response.text();
				const parsed = text ? JSON.parse(text) : null;

				if (!response.ok) {
					throw new AscApiError(response.status, parsed, {
						method,
						path: url.pathname,
					});
				}

				return parsed;
			},
			{
				isRetryable: error =>
					error instanceof AscApiError && RETRYABLE_STATUS.has(error.status),
				onRetry: (_error, attemptNumber, delayMs) =>
					console.warn(
						`  ↻ ${method} ${url.pathname} falhou, tentando de novo em ${delayMs}ms (tentativa ${attemptNumber + 1})`,
					),
			},
		);
	}

	return {
		get: (path, options) => request("GET", path, options),
		post: (path, body) => request("POST", path, { body }),
		patch: (path, body) => request("PATCH", path, { body }),
		delete: path => request("DELETE", path),
		/**
		 * `GET` que resolve para `null` em 404, para relacionamentos que a App
		 * Store Connect só materializa quando preenchidos (`appStoreReviewDetail`).
		 *
		 * @param {string} path
		 * @param {{ query?: Record<string, unknown> }} [options]
		 */
		async getOrNull(path, options) {
			try {
				return await request("GET", path, options);
			} catch (error) {
				if (error instanceof AscApiError && error.status === 404) return null;
				throw error;
			}
		},
		/**
		 * Executa uma `uploadOperation` de asset, cuja URL e headers são
		 * definidos pela própria App Store Connect na reserva do upload.
		 *
		 * @param {{ method: string, url: string, requestHeaders?: Array<{ name: string, value: string }>, body: Buffer }} operation
		 */
		async upload({ method, url, requestHeaders, body }) {
			const headers = Object.fromEntries(
				(requestHeaders ?? []).map(header => [header.name, header.value]),
			);
			const response = await fetch(url, { method, headers, body });
			if (!response.ok) {
				throw new Error(
					`Upload falhou (${response.status} ${response.statusText}) em ${url}`,
				);
			}
		},
	};
}

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
export function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}
