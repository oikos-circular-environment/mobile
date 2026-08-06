#!/usr/bin/env node
/**
 * @file Diagnóstico read-only da Google Play: trilhas e releases, ficha da loja,
 *   contagem de imagens por tipo e bundles enviados. Abre um edit apenas para
 *   ler e o descarta — sem `edits.commit`, nada chega à loja.
 *
 * Uso: `npm run play:inspect`
 *
 * @see docs/publishing-path.md — "Publicação na Google Play"
 */

import { getAndroidPackage } from "./lib/expo-config.mjs";
import {
	createPlay,
	playCall,
	readServiceAccountFromEnv,
	withEdit,
} from "./lib/play.mjs";

const IMAGE_TYPES = [
	"phoneScreenshots",
	"sevenInchScreenshots",
	"tenInchScreenshots",
	"featureGraphic",
	"icon",
];

const heading = title =>
	console.log(`\n── ${title} ${"─".repeat(Math.max(0, 56 - title.length))}`);

async function main() {
	const serviceAccount = readServiceAccountFromEnv();
	const packageName = getAndroidPackage();
	const play = createPlay({ serviceAccount, packageName });
	const { api } = play;

	heading("App");
	console.log(`  ${packageName}`);
	console.log(`  service account: ${serviceAccount.client_email}`);

	await withEdit(play, { dryRun: true }, async editId => {
		const { tracks } = await playCall("edits.tracks.list", () =>
			api.edits.tracks.list({ packageName, editId }),
		);
		heading("Trilhas");
		for (const track of tracks) {
			const releases = track.releases ?? [];
			if (releases.length === 0) {
				console.log(`  ${track.track.padEnd(12)} (vazia)`);
				continue;
			}
			for (const release of releases) {
				const rollout =
					release.userFraction !== undefined
						? ` @ ${release.userFraction * 100}%`
						: "";
				console.log(
					`  ${track.track.padEnd(12)} ${release.name} (${(release.versionCodes ?? []).join(", ")}) ${release.status}${rollout}`,
				);
			}
		}

		const details = await playCall("edits.details.get", () =>
			api.edits.details.get({ packageName, editId }),
		);
		heading("Contato");
		console.log(`  idioma padrão: ${details.defaultLanguage}`);
		console.log(`  e-mail:        ${details.contactEmail ?? "(vazio)"}`);
		console.log(`  site:          ${details.contactWebsite ?? "(vazio)"}`);
		console.log(`  telefone:      ${details.contactPhone ?? "(vazio)"}`);

		const { listings } = await playCall("edits.listings.list", () =>
			api.edits.listings.list({ packageName, editId }),
		);
		heading("Ficha");
		for (const listing of listings) {
			console.log(`  ${listing.language}: ${listing.title}`);
			console.log(`    curta:   ${listing.shortDescription}`);
			console.log(
				`    completa: ${listing.fullDescription?.length} caracteres`,
			);

			for (const type of IMAGE_TYPES) {
				const { images } = await playCall("edits.images.list", () =>
					api.edits.images.list({
						packageName,
						editId,
						language: listing.language,
						imageType: type,
					}),
				);
				console.log(`    ${type.padEnd(22)} ${images?.length ?? 0}`);
			}
		}

		const { bundles } = await playCall("edits.bundles.list", () =>
			api.edits.bundles.list({ packageName, editId }),
		);
		heading("Bundles enviados");
		console.log(`  ${(bundles ?? []).map(b => b.versionCode).join(", ")}`);
	});

	console.log("");
}

main().catch(error => {
	console.error(`\n✖ ${error.message}`);
	process.exit(1);
});
