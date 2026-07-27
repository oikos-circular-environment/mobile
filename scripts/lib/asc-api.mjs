// Cliente mínimo da App Store Connect API (JWT ES256 + fetch), sem dependências
// externas. Compartilhado por check-ios-app-version.mjs, submit-ios-for-review.mjs
// e asc-inspect.mjs.

import { execFileSync } from "node:child_process";
import { createSign } from "node:crypto";
import { readFileSync } from "node:fs";

const BASE_URL = "https://api.appstoreconnect.apple.com";
const TOKEN_TTL_SECONDS = 19 * 60;

/** Estados de App Store Version que não aceitam mais um novo build. */
export const NON_EDITABLE_VERSION_STATES = new Set([
	"READY_FOR_DISTRIBUTION",
	"READY_FOR_SALE",
	"PENDING_DEVELOPER_RELEASE",
	"PENDING_APPLE_RELEASE",
	"PROCESSING_FOR_APP_STORE",
	"REPLACED_WITH_NEW_VERSION",
]);

/** Estados de Review Submission que ainda estão em andamento na Apple. */
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
 * Erro que carrega a resposta estruturada da Apple, para mensagens legíveis em
 * vez de um dump de JSON cru.
 */
export class AscApiError extends Error {
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
 * Lê as credenciais da ASC do ambiente. `ASC_API_KEY_P8` é o *caminho* do
 * arquivo .p8 (é como o EAS materializa variáveis do tipo "file").
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
 * Cria um cliente com renovação automática do JWT. O token expira em 20 min e
 * esperar o processamento de um build pode passar disso.
 */
export function createAscClient({ keyId, issuerId, privateKeyPem }) {
	let token = null;
	let tokenExpiresAt = 0;

	function authorization() {
		const now = Date.now();
		if (!token || now >= tokenExpiresAt) {
			token = buildJwt({ keyId, issuerId, privateKeyPem });
			// Renova 60s antes do vencimento real, para não correr risco de
			// mandar uma requisição com token expirando no meio do voo.
			tokenExpiresAt = now + (TOKEN_TTL_SECONDS - 60) * 1000;
		}
		return `Bearer ${token}`;
	}

	async function request(method, path, { query, body } = {}) {
		const url = new URL(path.startsWith("http") ? path : `${BASE_URL}${path}`);
		for (const [key, value] of Object.entries(query ?? {})) {
			if (value !== undefined && value !== null) {
				url.searchParams.set(key, String(value));
			}
		}

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
	}

	return {
		get: (path, options) => request("GET", path, options),
		post: (path, body) => request("POST", path, { body }),
		patch: (path, body) => request("PATCH", path, { body }),
		delete: path => request("DELETE", path),
		/**
		 * GET que devolve `null` em vez de lançar quando o recurso não existe —
		 * vários relacionamentos da ASC (ex.: appStoreReviewDetail) respondem 404
		 * quando ainda não foram criados.
		 */
		async getOrNull(path, options) {
			try {
				return await request("GET", path, options);
			} catch (error) {
				if (error instanceof AscApiError && error.status === 404) return null;
				throw error;
			}
		},
		/** Upload de asset: a URL e os headers vêm prontos da própria ASC. */
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

/** Versão de marketing declarada em app.config.ts (fonte de verdade única). */
export function getExpoVersion() {
	const output = execFileSync(
		"npx",
		["expo", "config", "--json", "--type", "public"],
		{ encoding: "utf-8" },
	);
	return JSON.parse(output).version;
}

export function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}
