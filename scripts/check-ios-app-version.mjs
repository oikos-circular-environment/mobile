#!/usr/bin/env node
// Falha o workflow cedo se a `version` do app.config.ts já estiver
// anexada a uma App Store Version que não aceita mais um novo build
// (aprovada/ao vivo). Evita repetir o caso do build 19: enviado, mas
// sem conseguir entrar em review porque a versão 1.0.0 já estava live.

import {
	createAscClient,
	getExpoVersion,
	NON_EDITABLE_VERSION_STATES,
	readAscCredentialsFromEnv,
} from "./lib/asc-api.mjs";

async function fetchAppVersionState(client, appId, versionString) {
	const response = await client.get(`/v1/apps/${appId}/appStoreVersions`, {
		query: {
			"filter[versionString]": versionString,
			"fields[appStoreVersions]": "versionString,appVersionState",
		},
	});
	return response.data[0]?.attributes?.appVersionState ?? null;
}

async function main() {
	const credentials = readAscCredentialsFromEnv();
	const client = createAscClient(credentials);
	const version = getExpoVersion();
	const state = await fetchAppVersionState(client, credentials.appId, version);

	if (state && NON_EDITABLE_VERSION_STATES.has(state)) {
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
	console.error(error.message);
	process.exit(1);
});
