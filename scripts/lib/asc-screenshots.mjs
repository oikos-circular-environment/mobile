/**
 * @file Leitura, validação e upload dos screenshots da App Store.
 * @see docs/publishing-path.md — "Envio para o App Review"
 */

import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import { sleep } from "./asc-api.mjs";

/**
 * Resoluções aceitas por `screenshotDisplayType`, em ambas as orientações. Os
 * tamanhos introduzidos depois da última atualização da documentação da API
 * (iPhone 6.9" e iPad 13") reaproveitam os enums anteriores, que é como a
 * própria App Store Connect os classifica.
 *
 * @type {Record<string, { label: string, sizes: Array<[number, number]> }>}
 * @see docs/publishing-path.md — "Envio para o App Review", sobre `npm run asc:inspect`
 */
export const DISPLAY_TYPES = {
	APP_IPHONE_65: {
		label: 'iPhone 6.5"',
		sizes: [
			[1242, 2688],
			[2688, 1242],
		],
	},
	APP_IPHONE_67: {
		label: 'iPhone 6.7" / 6.9"',
		sizes: [
			[1290, 2796],
			[2796, 1290],
			[1320, 2868],
			[2868, 1320],
		],
	},
	APP_IPAD_PRO_3GEN_129: {
		label: 'iPad 12.9" / 13"',
		sizes: [
			[2048, 2732],
			[2732, 2048],
			[2064, 2752],
			[2752, 2064],
		],
	},
};

const IMAGE_EXTENSIONS = /\.(jpe?g|png)$/i;

/**
 * Extrai as dimensões de um JPEG a partir do primeiro marcador SOFn.
 *
 * @param {Buffer} buffer
 * @returns {{ width: number, height: number } | null}
 */
function readJpegSize(buffer) {
	let offset = 2;
	while (offset < buffer.length) {
		if (buffer[offset] !== 0xff) {
			offset += 1;
			continue;
		}
		const marker = buffer[offset + 1];
		const isStartOfFrame =
			marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);

		if (isStartOfFrame) {
			return {
				height: buffer.readUInt16BE(offset + 5),
				width: buffer.readUInt16BE(offset + 7),
			};
		}
		if (
			marker === 0xd8 ||
			marker === 0xd9 ||
			(marker >= 0xd0 && marker <= 0xd7)
		) {
			offset += 2;
			continue;
		}
		offset += 2 + buffer.readUInt16BE(offset + 2);
	}
	return null;
}

/**
 * Extrai as dimensões de um PNG a partir do chunk IHDR.
 *
 * @param {Buffer} buffer
 * @returns {{ width: number, height: number } | null}
 */
function readPngSize(buffer) {
	if (buffer.toString("ascii", 12, 16) !== "IHDR") return null;
	return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

/**
 * @param {string} filePath
 * @returns {{ width: number, height: number }}
 * @throws {Error} Se o formato não for JPEG nem PNG.
 */
export function readImageSize(filePath) {
	const buffer = readFileSync(filePath);
	const size =
		buffer[0] === 0x89 && buffer.toString("ascii", 1, 4) === "PNG"
			? readPngSize(buffer)
			: readJpegSize(buffer);

	if (!size) {
		throw new Error(`Não foi possível ler as dimensões de ${filePath}`);
	}
	return size;
}

/**
 * Agrupa os screenshots por `screenshotDisplayType`, que é o nome de cada
 * subdiretório. Os arquivos vêm ordenados pelo nome, e essa ordem é a que será
 * publicada na ficha da App Store.
 *
 * @param {string} screenshotsDir
 * @returns {Array<{ displayType: string, files: string[] }>} Vazio se o
 *   diretório não existir.
 */
export function collectScreenshots(screenshotsDir) {
	let entries;
	try {
		entries = readdirSync(screenshotsDir, { withFileTypes: true });
	} catch {
		return [];
	}

	return entries
		.filter(entry => entry.isDirectory())
		.map(entry => {
			const displayType = entry.name;
			const dir = join(screenshotsDir, displayType);
			const files = readdirSync(dir)
				.filter(file => IMAGE_EXTENSIONS.test(file))
				.sort((a, b) => a.localeCompare(b, "en"))
				.map(file => join(dir, file));

			return { displayType, files };
		})
		.filter(set => set.files.length > 0);
}

/**
 * Verifica display types, dimensões e a quantidade máxima por display type,
 * antes de qualquer chamada de rede.
 *
 * @param {Array<{ displayType: string, files: string[] }>} sets
 * @returns {string[]} Um problema por item; vazio quando tudo está válido.
 */
export function validateScreenshots(sets) {
	const problems = [];

	for (const { displayType, files } of sets) {
		const spec = DISPLAY_TYPES[displayType];
		if (!spec) {
			problems.push(
				`Display type desconhecido: "${displayType}". Conhecidos: ${Object.keys(DISPLAY_TYPES).join(", ")}. ` +
					"Se a Apple criou um novo, rode `npm run asc:inspect` e adicione-o em scripts/lib/asc-screenshots.mjs.",
			);
			continue;
		}

		if (files.length > 10) {
			problems.push(
				`${displayType}: ${files.length} imagens — a Apple aceita no máximo 10 por display type.`,
			);
		}

		for (const file of files) {
			const { width, height } = readImageSize(file);
			const accepted = spec.sizes.some(([w, h]) => w === width && h === height);
			if (!accepted) {
				const expected = spec.sizes.map(([w, h]) => `${w}x${h}`).join(" ou ");
				problems.push(
					`${basename(file)} (${displayType}) tem ${width}x${height}; ${spec.label} exige ${expected}.`,
				);
			}
		}
	}

	return problems;
}

/**
 * @param {ReturnType<import("./asc-api.mjs").createAscClient>} client
 * @param {string} localizationId
 * @param {string} displayType
 * @returns {Promise<object>} O `appScreenshotSet` existente ou recém-criado.
 */
async function findOrCreateScreenshotSet(client, localizationId, displayType) {
	const existing = await client.get(
		`/v1/appStoreVersionLocalizations/${localizationId}/appScreenshotSets`,
		{ query: { limit: 50 } },
	);

	const match = existing.data.find(
		set => set.attributes.screenshotDisplayType === displayType,
	);
	if (match) return match;

	const created = await client.post("/v1/appScreenshotSets", {
		data: {
			type: "appScreenshotSets",
			attributes: { screenshotDisplayType: displayType },
			relationships: {
				appStoreVersionLocalization: {
					data: { type: "appStoreVersionLocalizations", id: localizationId },
				},
			},
		},
	});
	return created.data;
}

/**
 * Envia um screenshot em três etapas, como exige a App Store Connect: reserva o
 * asset, executa cada `uploadOperation` devolvida na reserva e confirma o envio
 * com o MD5 do arquivo original.
 *
 * @param {ReturnType<import("./asc-api.mjs").createAscClient>} client
 * @param {string} setId
 * @param {string} filePath
 * @returns {Promise<string>} O id do `appScreenshot` criado.
 */
async function uploadOne(client, setId, filePath) {
	const buffer = readFileSync(filePath);
	const fileName = basename(filePath);

	const reservation = await client.post("/v1/appScreenshots", {
		data: {
			type: "appScreenshots",
			attributes: { fileName, fileSize: statSync(filePath).size },
			relationships: {
				appScreenshotSet: { data: { type: "appScreenshotSets", id: setId } },
			},
		},
	});

	const screenshotId = reservation.data.id;
	for (const operation of reservation.data.attributes.uploadOperations) {
		await client.upload({
			method: operation.method,
			url: operation.url,
			requestHeaders: operation.requestHeaders,
			body: buffer.subarray(
				operation.offset,
				operation.offset + operation.length,
			),
		});
	}

	await client.patch(`/v1/appScreenshots/${screenshotId}`, {
		data: {
			type: "appScreenshots",
			id: screenshotId,
			attributes: {
				uploaded: true,
				sourceFileChecksum: createHash("md5").update(buffer).digest("hex"),
			},
		},
	});

	return screenshotId;
}

/**
 * Aguarda o processamento assíncrono dos assets pela App Store Connect.
 *
 * @param {ReturnType<import("./asc-api.mjs").createAscClient>} client
 * @param {string[]} screenshotIds
 * @param {{ timeoutMs?: number }} [options]
 * @throws {Error} Se a Apple reportar erro em algum asset ou estourar o tempo.
 */
async function waitForAssetDelivery(
	client,
	screenshotIds,
	{ timeoutMs = 5 * 60_000 } = {},
) {
	const deadline = Date.now() + timeoutMs;

	while (Date.now() < deadline) {
		const states = await Promise.all(
			screenshotIds.map(async id => {
				const response = await client.get(`/v1/appScreenshots/${id}`);
				return {
					id,
					fileName: response.data.attributes.fileName,
					state: response.data.attributes.assetDeliveryState,
				};
			}),
		);

		const failed = states.filter(item => item.state?.errors?.length);
		if (failed.length > 0) {
			throw new Error(
				`A Apple rejeitou screenshots no processamento:\n${failed
					.map(
						item =>
							`  · ${item.fileName}: ${item.state.errors.map(e => e.description ?? e.code).join(", ")}`,
					)
					.join("\n")}`,
			);
		}

		if (states.every(item => item.state?.state === "COMPLETE")) return;
		await sleep(5_000);
	}

	throw new Error(
		"Timeout esperando a Apple processar os screenshots enviados.",
	);
}

/**
 * Publica os screenshots de uma localization. Display types que já contêm
 * imagens são preservados, salvo `force`, porque a App Store Connect copia os
 * screenshots da versão anterior ao criar uma App Store Version.
 *
 * @param {ReturnType<import("./asc-api.mjs").createAscClient>} client
 * @param {object} options
 * @param {string} options.localizationId
 * @param {Array<{ displayType: string, files: string[] }>} options.sets
 * @param {boolean} [options.force] Substitui os screenshots já publicados.
 * @param {(message: string) => void} [options.log]
 */
export async function syncScreenshots(
	client,
	{ localizationId, sets, force = false, log = console.log },
) {
	for (const { displayType, files } of sets) {
		const set = await findOrCreateScreenshotSet(
			client,
			localizationId,
			displayType,
		);

		const current = await client.get(
			`/v1/appScreenshotSets/${set.id}/appScreenshots`,
			{ query: { limit: 50 } },
		);

		if (current.data.length > 0 && !force) {
			log(
				`  ${displayType}: ${current.data.length} screenshot(s) já publicados — mantidos (use --force-screenshots para substituir).`,
			);
			continue;
		}

		for (const screenshot of current.data) {
			await client.delete(`/v1/appScreenshots/${screenshot.id}`);
		}

		const uploadedIds = [];
		for (const file of files) {
			log(`  ${displayType}: enviando ${basename(file)}…`);
			uploadedIds.push(await uploadOne(client, set.id, file));
		}

		await waitForAssetDelivery(client, uploadedIds);

		await client.patch(
			`/v1/appScreenshotSets/${set.id}/relationships/appScreenshots`,
			{
				data: uploadedIds.map(id => ({ type: "appScreenshots", id })),
			},
		);

		log(`  ${displayType}: ${uploadedIds.length} screenshot(s) publicados.`);
	}
}
