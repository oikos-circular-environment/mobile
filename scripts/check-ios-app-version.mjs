#!/usr/bin/env node
// Falha o workflow cedo se a `version` do app.config.ts já estiver
// anexada a uma App Store Version que não aceita mais um novo build
// (aprovada/ao vivo). Evita repetir o caso do build 19: enviado, mas
// sem conseguir entrar em review porque a versão 1.0.0 já estava live.

import { execFileSync } from "node:child_process";
import { createSign } from "node:crypto";
import { readFileSync } from "node:fs";

const NON_EDITABLE_STATES = new Set([
	"READY_FOR_DISTRIBUTION",
	"READY_FOR_SALE",
	"PENDING_DEVELOPER_RELEASE",
	"PENDING_APPLE_RELEASE",
	"PROCESSING_FOR_APP_STORE",
	"REPLACED_WITH_NEW_VERSION",
]);

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
		exp: now + 19 * 60,
		aud: "appstoreconnect-v1",
	};

	const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
	const der = createSign("SHA256")
		.update(signingInput)
		.sign({ key: privateKeyPem, dsaEncoding: "ieee-p1363" });

	return `${signingInput}.${base64url(der)}`;
}

async function fetchAppVersionState({ appId, token, versionString }) {
	const url = new URL(
		`https://api.appstoreconnect.apple.com/v1/apps/${appId}/appStoreVersions`,
	);
	url.searchParams.set("filter[versionString]", versionString);
	url.searchParams.set(
		"fields[appStoreVersions]",
		"versionString,appVersionState",
	);

	const response = await fetch(url, {
		headers: { Authorization: `Bearer ${token}` },
	});

	if (!response.ok) {
		throw new Error(
			`App Store Connect API respondeu ${response.status}: ${await response.text()}`,
		);
	}

	const body = await response.json();
	return body.data[0]?.attributes?.appVersionState ?? null;
}

function getExpoVersion() {
	const output = execFileSync(
		"npx",
		["expo", "config", "--json", "--type", "public"],
		{
			encoding: "utf-8",
		},
	);
	return JSON.parse(output).version;
}

async function main() {
	const appId = process.env.ASC_APP_ID ?? "6786017565";
	const keyId = process.env.ASC_API_KEY_ID;
	const issuerId = process.env.ASC_API_KEY_ISSUER_ID;
	const p8Path = process.env.ASC_API_KEY_P8;

	if (!keyId || !issuerId || !p8Path) {
		console.error(
			"ASC_API_KEY_ID, ASC_API_KEY_ISSUER_ID e ASC_API_KEY_P8 precisam estar configurados no ambiente.",
		);
		process.exit(1);
	}

	const privateKeyPem = readFileSync(p8Path, "utf-8");
	const version = getExpoVersion();
	const token = buildJwt({ keyId, issuerId, privateKeyPem });
	const state = await fetchAppVersionState({
		appId,
		token,
		versionString: version,
	});

	if (state && NON_EDITABLE_STATES.has(state)) {
		console.error(
			`A versão ${version} já está em estado "${state}" na App Store (aprovada/ao vivo) e não aceita mais builds. ` +
				`Faça o bump de "version" no app.config.ts (ex.: próximo patch) antes de rodar o build de produção.`,
		);
		process.exit(1);
	}

	console.log(
		state
			? `Versão ${version} ainda editável (estado: ${state}). Build liberado.`
			: `Versão ${version} ainda não existe no App Store Connect. Build liberado.`,
	);
}

main().catch(error => {
	console.error(error);
	process.exit(1);
});
