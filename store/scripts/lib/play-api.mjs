/**
 * @file Cliente da Google Play Android Developer API v3: autenticação por
 *   service account e transação de edit.
 * @see docs/publishing-path.md — "Publicação na Google Play"
 */

import { createSign } from "node:crypto";
import { readFileSync } from "node:fs";
import { RETRYABLE_STATUS, withRetry } from "./http-retry.mjs";

const BASE_URL = "https://androidpublisher.googleapis.com/androidpublisher/v3";
const SCOPE = "https://www.googleapis.com/auth/androidpublisher";
const TOKEN_TTL_SECONDS = 60 * 60;

/**
 * Status de release aceitos em `edits.tracks.update`. `inProgress` exige
 * `userFraction` entre 0 e 1; os demais o proíbem.
 *
 * @type {ReadonlyArray<string>}
 */
export const RELEASE_STATUSES = ["completed", "inProgress", "draft", "halted"];

/**
 * Erro de resposta da Play Developer API, com a mensagem da Google extraída do
 * envelope de erro.
 *
 * @property {number} status Código HTTP da resposta.
 * @property {object} body Corpo da resposta.
 */
export class PlayApiError extends Error {
	/**
	 * @param {number} status
	 * @param {object} body
	 * @param {{ method: string, path: string }} request
	 */
	constructor(status, body, { method, path }) {
		const detail = body?.error?.message ?? JSON.stringify(body);
		super(`Google Play respondeu ${status} em ${method} ${path}\n  ${detail}`);
		this.name = "PlayApiError";
		this.status = status;
		this.body = body;
	}
}

/**
 * Lê a service account do ambiente. `GOOGLE_SERVICE_ACCOUNT_KEY` contém o
 * caminho do arquivo JSON, não seu conteúdo — é como o EAS materializa
 * variáveis de ambiente do tipo `file`.
 *
 * @returns {object} A chave da service account.
 * @throws {Error} Se a variável não estiver definida.
 */
export function readServiceAccountFromEnv() {
	const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
	if (!keyPath) {
		throw new Error(
			"GOOGLE_SERVICE_ACCOUNT_KEY precisa apontar para o JSON da service account do Google Play.",
		);
	}
	return JSON.parse(readFileSync(keyPath, "utf-8"));
}

/**
 * Troca um JWT RS256 assinado pela service account por um access token OAuth.
 *
 * @param {object} serviceAccount
 * @returns {Promise<string>}
 */
async function requestAccessToken(serviceAccount) {
	const base64url = object =>
		Buffer.from(JSON.stringify(object)).toString("base64url");
	const now = Math.floor(Date.now() / 1000);
	const signingInput = `${base64url({ alg: "RS256", typ: "JWT" })}.${base64url({
		iss: serviceAccount.client_email,
		scope: SCOPE,
		aud: serviceAccount.token_uri,
		iat: now,
		exp: now + TOKEN_TTL_SECONDS,
	})}`;
	const signature = createSign("RSA-SHA256")
		.update(signingInput)
		.sign(serviceAccount.private_key)
		.toString("base64url");

	const response = await fetch(serviceAccount.token_uri, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
			assertion: `${signingInput}.${signature}`,
		}),
	});

	const body = await response.json();
	if (!response.ok) {
		throw new Error(
			`Falha ao obter access token da Google (${response.status}): ${JSON.stringify(body)}`,
		);
	}
	return body.access_token;
}

/**
 * Cria um cliente da Play Developer API para um pacote, com renovação
 * automática do access token.
 *
 * @param {{ serviceAccount: object, packageName: string }} options
 */
export function createPlayClient({ serviceAccount, packageName }) {
	let token = null;
	let tokenExpiresAt = 0;

	async function authorization() {
		const now = Date.now();
		if (!token || now >= tokenExpiresAt) {
			token = await requestAccessToken(serviceAccount);
			tokenExpiresAt = now + (TOKEN_TTL_SECONDS - 60) * 1000;
		}
		return `Bearer ${token}`;
	}

	/**
	 * @param {string} method
	 * @param {string} path Caminho relativo a `/applications/{packageName}`.
	 * @param {object} [body]
	 * @throws {PlayApiError} Em qualquer resposta fora da faixa 2xx, após
	 *   esgotar as tentativas em caso de 429/5xx.
	 */
	async function request(method, path, body) {
		const url = `${BASE_URL}/applications/${packageName}${path}`;

		return withRetry(
			async () => {
				const response = await fetch(url, {
					method,
					headers: {
						Authorization: await authorization(),
						...(body ? { "Content-Type": "application/json" } : {}),
					},
					body: body ? JSON.stringify(body) : undefined,
				});

				const text = await response.text();
				const parsed = text ? JSON.parse(text) : null;

				if (!response.ok) {
					throw new PlayApiError(response.status, parsed, { method, path });
				}
				return parsed;
			},
			{
				isRetryable: error =>
					error instanceof PlayApiError && RETRYABLE_STATUS.has(error.status),
				onRetry: (_error, attemptNumber, delayMs) =>
					console.warn(
						`  ↻ ${method} ${path} falhou, tentando de novo em ${delayMs}ms (tentativa ${attemptNumber + 1})`,
					),
			},
		);
	}

	return {
		packageName,
		get: path => request("GET", path),
		put: (path, body) => request("PUT", path, body),
		post: (path, body) => request("POST", path, body),
		delete: path => request("DELETE", path),
	};
}

/**
 * Executa `run` dentro de uma transação de edit. Toda escrita na Play passa por
 * um edit, e só `edits.commit` a torna pública: qualquer exceção — ou
 * `dryRun` — descarta o rascunho inteiro, deixando a loja intacta.
 *
 * @param {ReturnType<createPlayClient>} client
 * @param {{ dryRun?: boolean, log?: (message: string) => void }} options
 * @param {(editId: string) => Promise<void>} run
 * @returns {Promise<boolean>} `true` se o edit foi publicado.
 */
export async function withEdit(
	client,
	{ dryRun = false, log = () => {} },
	run,
) {
	const edit = await client.post("/edits");
	let committed = false;

	try {
		await run(edit.id);

		if (dryRun) {
			log("Rascunho descartado (--dry-run): nada foi publicado.");
		} else {
			await client.post(`/edits/${edit.id}:commit`);
			committed = true;
			log("Edit publicado na Google Play.");
		}
	} finally {
		if (!committed) {
			await client.delete(`/edits/${edit.id}`).catch(() => {});
		}
	}

	return committed;
}
