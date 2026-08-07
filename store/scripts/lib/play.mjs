/**
 * @file Acesso à Google Play Android Developer API: cliente autenticado, retry
 *   e a transação de edit.
 * @see docs/publishing-path.md — "Publicação na Google Play"
 */

import { readFileSync } from "node:fs";
import {
	androidpublisher,
	auth as googleAuth,
} from "@googleapis/androidpublisher";
import { RETRYABLE_STATUS, withRetry } from "./http-retry.mjs";

const SCOPE = "https://www.googleapis.com/auth/androidpublisher";

/**
 * Erro de resposta da Play Developer API, com a mensagem da Google extraída do
 * envelope de erro.
 *
 * @property {number} status Código HTTP da resposta.
 */
export class PlayApiError extends Error {
	/**
	 * @param {number} status
	 * @param {string} detail
	 * @param {string} operation
	 */
	constructor(status, detail, operation) {
		super(`Google Play respondeu ${status} em ${operation}\n  ${detail}`);
		this.name = "PlayApiError";
		this.status = status;
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
 * Cria o cliente da Play Developer API já autenticado pela service account. A
 * renovação do access token fica por conta da google-auth-library.
 *
 * @param {{ serviceAccount: object, packageName: string }} options
 * @returns {{ packageName: string, api: ReturnType<androidpublisher> }}
 */
export function createPlay({ serviceAccount, packageName }) {
	const client = new googleAuth.GoogleAuth({
		credentials: serviceAccount,
		scopes: [SCOPE],
	});
	return {
		packageName,
		api: androidpublisher({ version: "v3", auth: client }),
	};
}

/**
 * Executa uma chamada da API convertendo o erro da Google em `PlayApiError` e
 * repetindo em 429/5xx.
 *
 * @template T
 * @param {string} operation Nome da operação, para a mensagem de erro.
 * @param {() => Promise<{ data: T }>} call
 * @returns {Promise<T>}
 * @throws {PlayApiError} Fora da faixa 2xx, após esgotar as tentativas.
 */
export function playCall(operation, call) {
	return withRetry(
		async () => {
			try {
				const response = await call();
				return response.data;
			} catch (error) {
				const status = error?.status ?? error?.response?.status;
				if (status === undefined) throw error;

				const detail =
					error?.response?.data?.error?.message ?? error?.message ?? "";
				throw new PlayApiError(status, detail, operation);
			}
		},
		{
			isRetryable: error =>
				error instanceof PlayApiError && RETRYABLE_STATUS.has(error.status),
			onRetry: (_error, attemptNumber, delayMs) =>
				console.warn(
					`  ↻ ${operation} falhou, tentando de novo em ${delayMs}ms (tentativa ${attemptNumber + 1})`,
				),
		},
	);
}

/**
 * Executa `run` dentro de uma transação de edit. Toda escrita na Play passa por
 * um edit, e só `edits.commit` a torna pública: qualquer exceção — ou
 * `dryRun` — descarta o rascunho inteiro, deixando a loja intacta.
 *
 * @param {ReturnType<createPlay>} play
 * @param {{ dryRun?: boolean, log?: (message: string) => void }} options
 * @param {(editId: string) => Promise<void>} run
 * @returns {Promise<boolean>} `true` se o edit foi publicado.
 */
export async function withEdit(play, { dryRun = false, log = () => {} }, run) {
	const { api, packageName } = play;
	const edit = await playCall("edits.insert", () =>
		api.edits.insert({ packageName }),
	);
	let committed = false;

	try {
		await run(edit.id);

		if (dryRun) {
			log("Rascunho descartado (--dry-run): nada foi publicado.");
		} else {
			await playCall("edits.commit", () =>
				api.edits.commit({ packageName, editId: edit.id }),
			);
			committed = true;
			log("Edit publicado na Google Play.");
		}
	} finally {
		if (!committed) {
			await api.edits.delete({ packageName, editId: edit.id }).catch(() => {});
		}
	}

	return committed;
}
