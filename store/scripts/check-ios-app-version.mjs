#!/usr/bin/env node
/**
 * @file Interrompe o workflow antes do build quando a `version` declarada em
 *   `app.config.ts` já está em uma App Store Version que não aceita mais um
 *   build novo, exigindo bump de versão.
 *
 * @see docs/publishing-path.md — "Versionamento sincronizado entre iOS e Android"
 */

import { appsAppStoreVersionsGetToManyRelated } from "@oikos-circular-environment/apple-connect-api";
import { ascCall, createAsc, NON_EDITABLE_VERSION_STATES } from "./lib/asc.mjs";
import { getExpoVersion } from "./lib/expo-config.mjs";

/**
 * @param {ReturnType<import("./lib/asc.mjs").createAsc>["client"]} client
 * @param {string} appId
 * @param {string} versionString
 * @returns {Promise<string|null>} O `appVersionState`, ou `null` se a versão
 *   ainda não existir na App Store Connect.
 */
async function fetchAppVersionState(client, appId, versionString) {
	const response = await ascCall(appsAppStoreVersionsGetToManyRelated, {
		client,
		path: { id: appId },
		query: {
			"filter[versionString]": [versionString],
			"fields[appStoreVersions]": ["versionString", "appVersionState"],
		},
	});
	return response.data[0]?.attributes?.appVersionState ?? null;
}

async function main() {
	const { appId, client } = createAsc();
	const version = getExpoVersion();
	const state = await fetchAppVersionState(client, appId, version);

	if (state && NON_EDITABLE_VERSION_STATES.has(state)) {
		const inReview = state === "WAITING_FOR_REVIEW" || state === "IN_REVIEW";
		console.error(
			`A versão ${version} está em estado "${state}" na App Store e não aceita mais builds. ` +
				(inReview
					? 'Ela já foi enviada e está na fila da Apple. Faça o bump de "version" no app.config.ts, ' +
						"ou cancele o envio na App Store Connect se a intenção era substituir o build."
					: 'Faça o bump de "version" no app.config.ts (ex.: próximo patch) antes de rodar o build de produção.'),
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
