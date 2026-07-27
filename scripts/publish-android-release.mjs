#!/usr/bin/env node
/**
 * @file Publica as notas da versão e o destino de trilha do build já enviado
 *   pelo `eas submit`, e sincroniza os dados de contato da ficha. Idempotente:
 *   sem diferença a publicar, o rascunho é descartado sem commit.
 *
 * Flags: `--dry-run`, `--track=<trilha>`,
 * `--version-code=<n>` (default: variável de ambiente `ANDROID_VERSION_CODE`).
 *
 * @see docs/publishing-path.md — "Publicação na Google Play"
 */

import { getAndroidPackage, getExpoVersion } from "./lib/expo-config.mjs";
import {
	createPlayClient,
	RELEASE_STATUSES,
	readServiceAccountFromEnv,
	withEdit,
} from "./lib/play-api.mjs";
import {
	RELEASE_NOTES_MAX_LENGTH,
	readContact,
	readStoreJson,
	readWhatsNew,
	whatsNewPath,
} from "./lib/store-config.mjs";

const flags = {
	dryRun: process.argv.includes("--dry-run"),
	track: process.argv
		.find(argument => argument.startsWith("--track="))
		?.split("=")[1],
	versionCode:
		process.argv
			.find(argument => argument.startsWith("--version-code="))
			?.split("=")[1] ?? process.env.ANDROID_VERSION_CODE,
};

const step = message => console.log(`\n▸ ${message}`);
const info = message => console.log(`  ${message}`);

/**
 * Carrega e valida a configuração do release antes de abrir o edit.
 *
 * @param {string} version
 * @returns {{ release: object, details: object, releaseNotes: string }}
 * @throws {Error} Listando todos os problemas encontrados.
 */
function loadReleaseConfig(version) {
	const release = { ...readStoreJson("android/release.json") };
	if (flags.track) release.track = flags.track;

	const contact = readContact();
	const details = {
		defaultLanguage: release.defaultLanguage,
		contactEmail: contact.email,
		contactWebsite: contact.website,
	};
	const releaseNotes = readWhatsNew(version, "android");

	const problems = [];

	if (!releaseNotes) {
		problems.push(
			`${whatsNewPath(version, "android")} não existe ou está vazio.`,
		);
	} else if (releaseNotes.length > RELEASE_NOTES_MAX_LENGTH) {
		problems.push(
			`${whatsNewPath(version, "android")} tem ${releaseNotes.length} caracteres; a Google aceita no máximo ${RELEASE_NOTES_MAX_LENGTH}.`,
		);
	}

	if (!RELEASE_STATUSES.includes(release.status)) {
		problems.push(
			`store/android/release.json: "status" inválido (${release.status}). Aceitos: ${RELEASE_STATUSES.join(", ")}.`,
		);
	}

	const hasUserFraction = release.userFraction !== undefined;
	if (release.status === "inProgress" && !hasUserFraction) {
		problems.push(
			'store/android/release.json: "status" inProgress exige "userFraction" entre 0 e 1.',
		);
	}
	if (release.status !== "inProgress" && hasUserFraction) {
		problems.push(
			`store/android/release.json: "userFraction" só é aceito com "status" inProgress.`,
		);
	}

	if (problems.length > 0) {
		throw new Error(
			`Configuração do release incompleta:\n${problems.map(p => `  · ${p}`).join("\n")}`,
		);
	}

	return { release, details, releaseNotes };
}

/**
 * Descobre o versionCode a publicar quando ele não foi informado, usando o
 * maior bundle já enviado — que é o que o `eas submit` acabou de subir.
 *
 * @param {ReturnType<createPlayClient>} client
 * @param {string} editId
 * @returns {Promise<string>}
 * @throws {Error} Se nenhum bundle tiver sido enviado.
 */
async function resolveVersionCode(client, editId) {
	if (flags.versionCode) return String(flags.versionCode);

	const { bundles } = await client.get(`/edits/${editId}/bundles`);
	const latest = (bundles ?? [])
		.map(bundle => Number(bundle.versionCode))
		.sort((a, b) => b - a)[0];

	if (!latest) {
		throw new Error(
			"Nenhum bundle encontrado na Google Play. Rode o `eas submit` antes.",
		);
	}
	info(`versionCode não informado; usando o mais recente enviado: ${latest}.`);
	return String(latest);
}

/**
 * Sincroniza os dados de contato da ficha.
 *
 * @param {ReturnType<createPlayClient>} client
 * @param {string} editId
 * @param {object} details
 * @returns {Promise<boolean>} `true` se havia diferença a publicar.
 */
async function syncDetails(client, editId, details) {
	const current = await client.get(`/edits/${editId}/details`);
	const changed = Object.entries(details).filter(
		([key, value]) => current[key] !== value,
	);

	if (changed.length === 0) {
		info("Dados de contato já estão sincronizados.");
		return false;
	}

	for (const [key, value] of changed) {
		info(`${key}: ${current[key] ?? "(vazio)"} → ${value}`);
	}
	await client.put(`/edits/${editId}/details`, { ...current, ...details });
	return true;
}

/**
 * Publica o versionCode e as notas da versão na trilha configurada.
 *
 * @param {ReturnType<createPlayClient>} client
 * @param {string} editId
 * @param {object} options
 * @returns {Promise<boolean>} `true` se havia diferença a publicar.
 */
async function syncTrack(
	client,
	editId,
	{ release, version, versionCode, releaseNotes },
) {
	const { releases = [] } = await client.get(
		`/edits/${editId}/tracks/${release.track}`,
	);

	const target = {
		name: version,
		versionCodes: [versionCode],
		status: release.status,
		releaseNotes: [{ language: release.locale, text: releaseNotes }],
		...(release.userFraction !== undefined
			? { userFraction: release.userFraction }
			: {}),
	};

	const current = releases.find(item =>
		(item.versionCodes ?? []).includes(versionCode),
	);
	const unchanged =
		current &&
		current.status === target.status &&
		current.userFraction === release.userFraction &&
		current.releaseNotes?.[0]?.text === releaseNotes;

	if (unchanged) {
		info(
			`Trilha ${release.track} já está com ${version} (${versionCode}) e as mesmas notas.`,
		);
		return false;
	}

	/** Releases de outros versionCodes na trilha, preservados como estão. */
	const others = releases.filter(
		item => !(item.versionCodes ?? []).includes(versionCode),
	);
	await client.put(`/edits/${editId}/tracks/${release.track}`, {
		track: release.track,
		releases: [...others, target],
	});

	info(
		`Trilha ${release.track}: ${version} (${versionCode}) como "${release.status}"` +
			(release.userFraction !== undefined
				? ` a ${release.userFraction * 100}% dos usuários.`
				: "."),
	);
	return true;
}

async function main() {
	const serviceAccount = readServiceAccountFromEnv();
	const packageName = getAndroidPackage();
	const version = getExpoVersion();
	const client = createPlayClient({ serviceAccount, packageName });

	step(`Release Android ${version}${flags.dryRun ? " (dry-run)" : ""}`);
	const config = loadReleaseConfig(version);
	info(`${packageName} → trilha ${config.release.track}`);

	await withEdit(client, { dryRun: flags.dryRun, log: info }, async editId => {
		const versionCode = await resolveVersionCode(client, editId);

		step("Dados de contato");
		const detailsChanged = await syncDetails(client, editId, config.details);

		step("Trilha e notas da versão");
		const trackChanged = await syncTrack(client, editId, {
			...config,
			version,
			versionCode,
		});

		if (!detailsChanged && !trackChanged) {
			info("Nada a publicar.");
		}
	});
}

main().catch(error => {
	console.error(`\n✖ ${error.message}`);
	process.exit(1);
});
