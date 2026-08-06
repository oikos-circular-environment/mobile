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
	createPlayClient,
	readServiceAccountFromEnv,
	withEdit,
} from "./lib/play-api.mjs";

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
	const client = createPlayClient({ serviceAccount, packageName });

	heading("App");
	console.log(`  ${packageName}`);
	console.log(`  service account: ${serviceAccount.client_email}`);

	await withEdit(client, { dryRun: true }, async editId => {
		const { tracks } = await client.get(`/edits/${editId}/tracks`);
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

		const details = await client.get(`/edits/${editId}/details`);
		heading("Contato");
		console.log(`  idioma padrão: ${details.defaultLanguage}`);
		console.log(`  e-mail:        ${details.contactEmail ?? "(vazio)"}`);
		console.log(`  site:          ${details.contactWebsite ?? "(vazio)"}`);
		console.log(`  telefone:      ${details.contactPhone ?? "(vazio)"}`);

		const { listings } = await client.get(`/edits/${editId}/listings`);
		heading("Ficha");
		for (const listing of listings) {
			console.log(`  ${listing.language}: ${listing.title}`);
			console.log(`    curta:   ${listing.shortDescription}`);
			console.log(
				`    completa: ${listing.fullDescription?.length} caracteres`,
			);

			for (const type of IMAGE_TYPES) {
				const { images } = await client.get(
					`/edits/${editId}/listings/${listing.language}/${type}`,
				);
				console.log(`    ${type.padEnd(22)} ${images?.length ?? 0}`);
			}
		}

		const { bundles } = await client.get(`/edits/${editId}/bundles`);
		heading("Bundles enviados");
		console.log(`  ${(bundles ?? []).map(b => b.versionCode).join(", ")}`);
	});

	console.log("");
}

main().catch(error => {
	console.error(`\n✖ ${error.message}`);
	process.exit(1);
});
