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
	appStoreVersionLocalizationsAppScreenshotSetsGetToManyRelated,
	appStoreVersionsAppStoreVersionLocalizationsGetToManyRelated,
	appsAppStoreVersionsGetToManyRelated,
	appsGetInstance,
	buildsGetCollection,
	reviewSubmissionsGetCollection,
} from "@oikos-circular-environment/apple-connect-api";
import {
	ascCall,
	createAsc,
	OPEN_REVIEW_SUBMISSION_STATES,
} from "./lib/asc.mjs";
import { getExpoVersion } from "./lib/expo-config.mjs";

const heading = title =>
	console.log(`\n── ${title} ${"─".repeat(Math.max(0, 56 - title.length))}`);

async function main() {
	const { appId, client } = createAsc();
	const version = getExpoVersion();

	const app = await ascCall(appsGetInstance, {
		client,
		path: { id: appId },
		query: { "fields[apps]": ["name", "bundleId", "sku"] },
	});
	heading("App");
	console.log(
		`  ${app.data.attributes.name} (${app.data.attributes.bundleId}) — id ${appId}`,
	);
	console.log(`  version em app.config.ts: ${version}`);

	heading("App Store Versions");
	const versions = await ascCall(appsAppStoreVersionsGetToManyRelated, {
		client,
		path: { id: appId },
		query: {
			"filter[platform]": ["IOS"],
			"fields[appStoreVersions]": [
				"versionString",
				"appVersionState",
				"createdDate",
				"releaseType",
			],
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
	const builds = await ascCall(buildsGetCollection, {
		client,
		query: {
			"filter[app]": [appId],
			// preReleaseVersion precisa estar em fields[builds], não só em
			// include — sparse fieldset também filtra relationships.
			"fields[builds]": [
				"version",
				"processingState",
				"uploadedDate",
				"expired",
				"preReleaseVersion",
			],
			include: ["preReleaseVersion"],
			limit: 10,
			sort: ["-uploadedDate"],
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
		const localizations = await ascCall(
			appStoreVersionsAppStoreVersionLocalizationsGetToManyRelated,
			{ client, path: { id: current.id }, query: { limit: 50 } },
		);
		console.log(`  versão inspecionada: ${current.attributes.versionString}`);
		for (const localization of localizations.data) {
			const sets = await ascCall(
				appStoreVersionLocalizationsAppScreenshotSetsGetToManyRelated,
				{ client, path: { id: localization.id }, query: { limit: 50 } },
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
	const submissions = await ascCall(reviewSubmissionsGetCollection, {
		client,
		query: {
			"filter[app]": [appId],
			"filter[platform]": ["IOS"],
			"filter[state]": OPEN_REVIEW_SUBMISSION_STATES,
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
