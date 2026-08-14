#!/usr/bin/env node
/**
 * @file Publica as notas da versão e sincroniza os dados de contato da ficha —
 *   o que o `eas submit` não cobre na Google Play. Trilha, status do release e
 *   rollout vêm de `submit.production.android` no `eas.json`, aplicados pelo
 *   próprio `eas submit`. Idempotente: sem diferença a publicar, o rascunho é
 *   descartado sem commit.
 *
 * Flags: `--dry-run`,
 * `--version-code=<n>` (default: variável de ambiente `ANDROID_VERSION_CODE`).
 *
 * @see docs/publishing-path.md — "Publicação na Google Play"
 */

import {
	getAndroidPackage,
	getExpoVersion,
	getSubmitProfile,
} from "./lib/expo-config.mjs";
import {
	createPlay,
	playCall,
	readServiceAccountFromEnv,
	withEdit,
} from "./lib/play.mjs";
import {
	RELEASE_NOTES_MAX_LENGTH,
	readContact,
	readStoreJson,
	readWhatsNew,
	whatsNewPath,
} from "./lib/store-config.mjs";

const VERSION_CODE_PATTERN = /^\d+$/;

const flags = {
	dryRun: process.argv.includes("--dry-run"),
	versionCode:
		process.argv
			.find(argument => argument.startsWith("--version-code="))
			?.split("=")[1] ?? process.env.ANDROID_VERSION_CODE,
};

if (
	flags.versionCode &&
	!VERSION_CODE_PATTERN.test(String(flags.versionCode))
) {
	console.error(
		`\n✖ --version-code recebeu "${flags.versionCode}", que não é um número. ` +
			"Isso normalmente indica uma expressão needs.*.outputs não interpolada — " +
			"confira se o `env` que a define está no nível do job, não de um step " +
			"individual (ver docs/publishing-path.md).",
	);
	process.exit(1);
}

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
	const submitProfile = getSubmitProfile("android");
	const release = {
		...readStoreJson("android/release.json"),
		track: submitProfile.track,
		status: submitProfile.releaseStatus ?? "completed",
		...(submitProfile.rollout !== undefined
			? { userFraction: submitProfile.rollout }
			: {}),
	};

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

	if (!release.track) {
		problems.push('eas.json: submit.production.android não define "track".');
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
 * @param {ReturnType<createPlay>} play
 * @param {string} editId
 * @returns {Promise<string>}
 * @throws {Error} Se nenhum bundle tiver sido enviado.
 */
async function resolveVersionCode({ api, packageName }, editId) {
	if (flags.versionCode) return String(flags.versionCode);

	const { bundles } = await playCall("edits.bundles.list", () =>
		api.edits.bundles.list({ packageName, editId }),
	);
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
 * @param {ReturnType<createPlay>} play
 * @param {string} editId
 * @param {object} details
 * @returns {Promise<boolean>} `true` se havia diferença a publicar.
 */
async function syncDetails({ api, packageName }, editId, details) {
	const current = await playCall("edits.details.get", () =>
		api.edits.details.get({ packageName, editId }),
	);
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
	await playCall("edits.details.update", () =>
		api.edits.details.update({
			packageName,
			editId,
			requestBody: { ...current, ...details },
		}),
	);
	return true;
}

/**
 * Publica o versionCode e as notas da versão na trilha configurada.
 *
 * @param {ReturnType<createPlay>} play
 * @param {string} editId
 * @param {object} options
 * @returns {Promise<boolean>} `true` se havia diferença a publicar.
 */
async function syncTrack(
	{ api, packageName },
	editId,
	{ release, version, versionCode, releaseNotes },
) {
	const { releases = [] } = await playCall("edits.tracks.get", () =>
		api.edits.tracks.get({ packageName, editId, track: release.track }),
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
	await playCall("edits.tracks.update", () =>
		api.edits.tracks.update({
			packageName,
			editId,
			track: release.track,
			requestBody: { track: release.track, releases: [...others, target] },
		}),
	);

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
	const play = createPlay({ serviceAccount, packageName });

	step(`Release Android ${version}${flags.dryRun ? " (dry-run)" : ""}`);
	const config = loadReleaseConfig(version);
	info(`${packageName} → trilha ${config.release.track}`);

	await withEdit(play, { dryRun: flags.dryRun, log: info }, async editId => {
		const versionCode = await resolveVersionCode(play, editId);

		step("Dados de contato");
		const detailsChanged = await syncDetails(play, editId, config.details);

		step("Trilha e notas da versão");
		const trackChanged = await syncTrack(play, editId, {
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
