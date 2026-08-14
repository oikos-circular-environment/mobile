#!/usr/bin/env node
/**
 * @file Roda `eas metadata:push` e falha explicitamente se a saída indicar
 *   problema em upload/exclusão/reordenação de screenshots — o próprio
 *   comando pode sair com código 0 mesmo com essas falhas parciais.
 *   Ver expo/eas-cli#3689 (aberta, sem correção até ago/2026).
 *
 * @see docs/publishing-path.md — "Publicação na App Store"
 */

import { spawn } from "node:child_process";

const FAILURE_PATTERNS = [/✖/, /failed to \w+/i, /error uploading/i];

/**
 * @returns {Promise<{ code: number, combined: string }>}
 */
function runMetadataPush() {
	return new Promise((resolve, reject) => {
		// `eas-cli` e não `eas`: o npx resolve pelo nome do pacote, não do binário.
		const child = spawn(
			"npx",
			["--yes", "eas-cli", "metadata:push", "--non-interactive"],
			{
				stdio: ["ignore", "pipe", "pipe"],
				env: process.env,
			},
		);

		let combined = "";
		const relay = (stream, target) => {
			stream.on("data", chunk => {
				combined += chunk.toString();
				target.write(chunk);
			});
		};
		relay(child.stdout, process.stdout);
		relay(child.stderr, process.stderr);

		child.on("error", reject);
		child.on("close", code => resolve({ code: code ?? 1, combined }));
	});
}

async function main() {
	const { code, combined } = await runMetadataPush();

	if (code !== 0) {
		console.error(`\n✖ eas metadata:push saiu com código ${code}.`);
		process.exit(code);
	}

	const hit = FAILURE_PATTERNS.find(pattern => pattern.test(combined));
	if (hit) {
		console.error(
			"\n✖ eas metadata:push saiu com código 0, mas a saída contém um indício de " +
				`falha parcial (padrão ${hit}) — provavelmente upload, exclusão ou ` +
				"reordenação de screenshot (expo/eas-cli#3689). Revise o log acima: a " +
				'ficha pode estar incompleta mesmo com o comando "tendo dado certo".',
		);
		process.exit(1);
	}

	console.log("\n✓ eas metadata:push concluído sem indícios de falha parcial.");
}

main().catch(error => {
	console.error(`\n✖ ${error.message}`);
	process.exit(1);
});
