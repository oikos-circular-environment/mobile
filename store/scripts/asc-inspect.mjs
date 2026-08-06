#!/usr/bin/env node
/**
 * @file Diagnóstico read-only da App Store Connect: estado das versões, builds
 *   processados, `screenshotDisplayType` em uso e review submissions abertas.
 *
 * Uso: `npm run asc:inspect`
 *
 * @see docs/publishing-path.md — "Envio para o App Review"
 */

import {
	createAscClient,
	OPEN_REVIEW_SUBMISSION_STATES,
	readAscCredentialsFromEnv,
} from "./lib/asc-api.mjs";
import { getExpoVersion } from "./lib/expo-config.mjs";

const heading = title =>
	console.log(`\n── ${title} ${"─".repeat(Math.max(0, 56 - title.length))}`);

async function main() {
	const credentials = readAscCredentialsFromEnv();
	const client = createAscClient(credentials);
	const { appId } = credentials;
	const version = getExpoVersion();

	const app = await client.get(`/v1/apps/${appId}`, {
		query: { "fields[apps]": "name,bundleId,sku" },
	});
	heading("App");
	console.log(
		`  ${app.data.attributes.name} (${app.data.attributes.bundleId}) — id ${appId}`,
	);
	console.log(`  version em app.config.ts: ${version}`);

	heading("App Store Versions");
	const versions = await client.get(`/v1/apps/${appId}/appStoreVersions`, {
		query: {
			"filter[platform]": "IOS",
			"fields[appStoreVersions]":
				"versionString,appVersionState,createdDate,releaseType",
			limit: 10,
		},
	});
	for (const item of versions.data) {
		const marker = item.attributes.versionString === version ? "→" : " ";
		console.log(
			`${marker} ${item.attributes.versionString.padEnd(8)} ${item.attributes.appVersionState.padEnd(28)} ${item.attributes.releaseType ?? ""}`,
		);
	}
	if (versions.data.length === 0) console.log("  (nenhuma)");

	heading("Builds recentes");
	const builds = await client.get("/v1/builds", {
		query: {
			"filter[app]": appId,
			// preReleaseVersion precisa estar em fields[builds], não só em
			// include — sparse fieldset também filtra relationships.
			"fields[builds]":
				"version,processingState,uploadedDate,expired,preReleaseVersion",
			include: "preReleaseVersion",
			limit: 10,
			sort: "-uploadedDate",
		},
	});
	const trains = new Map(
		(builds.included ?? []).map(item => [item.id, item.attributes.version]),
	);
	for (const build of builds.data) {
		const train =
			trains.get(build.relationships?.preReleaseVersion?.data?.id) ?? "?";
		console.log(
			`  ${train} (${build.attributes.version})`.padEnd(20) +
				`${build.attributes.processingState.padEnd(12)} ${build.attributes.expired ? "expirado" : ""}`,
		);
	}
	if (builds.data.length === 0) console.log("  (nenhum)");

	heading("Screenshot display types em uso");
	const current =
		versions.data.find(item => item.attributes.versionString === version) ??
		versions.data[0];

	if (!current) {
		console.log("  (nenhuma versão para inspecionar)");
	} else {
		const localizations = await client.get(
			`/v1/appStoreVersions/${current.id}/appStoreVersionLocalizations`,
			{ query: { limit: 50 } },
		);
		console.log(`  versão inspecionada: ${current.attributes.versionString}`);
		for (const localization of localizations.data) {
			const sets = await client.get(
				`/v1/appStoreVersionLocalizations/${localization.id}/appScreenshotSets`,
				{ query: { limit: 50 } },
			);
			const summary = sets.data
				.map(set => set.attributes.screenshotDisplayType)
				.join(", ");
			console.log(
				`  ${localization.attributes.locale}: ${summary || "(sem screenshots)"}`,
			);
		}
	}

	heading("Review submissions abertas");
	// /v1/reviewSubmissions não aceita `sort` — confere a lista de parâmetros
	// no OpenAPI da App Store Connect antes de reintroduzir.
	const submissions = await client.get("/v1/reviewSubmissions", {
		query: {
			"filter[app]": appId,
			"filter[platform]": "IOS",
			"filter[state]": OPEN_REVIEW_SUBMISSION_STATES.join(","),
			limit: 5,
		},
	});
	for (const submission of submissions.data) {
		console.log(
			`  ${submission.attributes.state.padEnd(22)} ${submission.attributes.submittedDate ?? ""}`,
		);
	}
	if (submissions.data.length === 0) console.log("  (nenhuma)");

	console.log("");
}

main().catch(error => {
	console.error(`\n✖ ${error.message}`);
	process.exit(1);
});
