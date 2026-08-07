/**
 * @file Resolução dos dados de release em `store/`, combinando o que é comum às
 *   duas lojas (`store/shared/`) com o que é específico de cada uma.
 * @see docs/publishing-path.md — "Dados de release em store/"
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * Localiza `store/` subindo a partir do diretório atual. A busca evita
 * `import.meta.url`, que não sobrevive à transpilação para CommonJS feita pelo
 * Jest, e torna os scripts imunes ao diretório de onde são chamados.
 *
 * @returns {string}
 * @throws {Error} Se não houver `store/shared/` em nenhum diretório acima.
 */
function findStoreDir() {
	let current = process.cwd();

	while (true) {
		const candidate = join(current, "store");
		if (existsSync(join(candidate, "shared"))) return candidate;

		const parent = dirname(current);
		if (parent === current) break;
		current = parent;
	}

	throw new Error(
		`Diretório store/ não encontrado a partir de ${process.cwd()}.`,
	);
}

export const STORE_DIR = findStoreDir();

/** Limite de caracteres das notas da versão na Google Play. */
export const RELEASE_NOTES_MAX_LENGTH = 500;

/**
 * @param {string} relativePath Caminho relativo a `store/`.
 * @returns {object}
 */
export function readStoreJson(relativePath) {
	return JSON.parse(readFileSync(join(STORE_DIR, relativePath), "utf-8"));
}

/**
 * Dados de contato comuns às duas lojas.
 *
 * @returns {{ email: string, supportUrl: string, website: string }}
 */
export function readContact() {
	return readStoreJson("shared/contact.json");
}

/**
 * Notas da versão. Uma loja pode sobrescrever o texto comum criando
 * `store/<loja>/whats-new/<version>.md`; sem override, vale o de
 * `store/shared/whats-new/<version>.md`.
 *
 * @param {string} version
 * @param {"ios"|"android"} store
 * @returns {string} Vazio quando não há arquivo para a versão.
 */
export function readWhatsNew(version, store) {
	const candidates = [
		join(STORE_DIR, store, "whats-new", `${version}.md`),
		join(STORE_DIR, "shared", "whats-new", `${version}.md`),
	];

	for (const candidate of candidates) {
		if (existsSync(candidate)) return readFileSync(candidate, "utf-8").trim();
	}
	return "";
}

/**
 * Caminho, relativo à raiz do repositório, do arquivo de notas que
 * `readWhatsNew` usaria — para mensagens de erro acionáveis.
 *
 * @param {string} version
 * @param {"ios"|"android"} store
 * @returns {string}
 */
export function whatsNewPath(version, store) {
	const override = join(STORE_DIR, store, "whats-new", `${version}.md`);
	return existsSync(override)
		? `store/${store}/whats-new/${version}.md`
		: `store/shared/whats-new/${version}.md`;
}
