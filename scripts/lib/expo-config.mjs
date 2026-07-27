/**
 * @file Leitura do config público do Expo, fonte de verdade da versão de
 *   marketing e dos identificadores de aplicativo em cada loja.
 */

import { execFileSync } from "node:child_process";

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
