/**
 * @file Leitura do config público do Expo, fonte de verdade da versão de
 *   marketing e dos identificadores de aplicativo em cada loja.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

let cached = null;

/**
 * @returns {object} O config resolvido de `app.config.ts`.
 */
export function getExpoConfig() {
	if (!cached) {
		const output = execFileSync(
			"npx",
			["expo", "config", "--json", "--type", "public"],
			{ encoding: "utf-8" },
		);
		cached = JSON.parse(output);
	}
	return cached;
}

/**
 * Versão de marketing compartilhada pelas duas lojas.
 *
 * @returns {string}
 */
export function getExpoVersion() {
	return getExpoConfig().version;
}

/**
 * @returns {string} O `applicationId` do Android.
 */
export function getAndroidPackage() {
	return getExpoConfig().android.package;
}

/**
 * Perfil de submissão do `eas.json`. É de lá, e não de `store/`, que vêm a
 * trilha, o status do release e o rollout do Android — o `eas submit` já os
 * aplica, e duplicá-los criaria duas fontes de verdade para o mesmo destino.
 *
 * @param {"android"|"ios"} platform
 * @param {string} [profile]
 * @returns {object}
 * @throws {Error} Se o perfil não existir em eas.json.
 */
export function getSubmitProfile(platform, profile = "production") {
	let current = process.cwd();
	let easJsonPath = null;

	while (true) {
		const candidate = join(current, "eas.json");
		if (existsSync(candidate)) {
			easJsonPath = candidate;
			break;
		}
		const parent = dirname(current);
		if (parent === current) break;
		current = parent;
	}

	if (!easJsonPath) {
		throw new Error(`eas.json não encontrado a partir de ${process.cwd()}.`);
	}

	const easJson = JSON.parse(readFileSync(easJsonPath, "utf-8"));
	const submitProfile = easJson.submit?.[profile]?.[platform];

	if (!submitProfile) {
		throw new Error(`eas.json não define submit.${profile}.${platform}.`);
	}
	return submitProfile;
}
