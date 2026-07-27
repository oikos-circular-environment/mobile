// Upload de screenshots para a App Store Connect.
//
// O fluxo da Apple tem três etapas por arquivo:
//   1. POST /v1/appScreenshots  → "reserva" o asset e devolve uploadOperations
//   2. PUT em cada uploadOperation (o arquivo pode vir fatiado em N partes)
//   3. PATCH /v1/appScreenshots/{id} com uploaded:true + MD5 do arquivo original
//
// Depois a Apple processa o asset de forma assíncrona (assetDeliveryState).

import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import { sleep } from "./asc-api.mjs";

/**
 * Tamanhos aceitos por display type.
 *
 * Atenção: a Apple nunca publicou os enums novos (iPhone 6.9" e iPad 13") na
 * documentação da API — a própria App Store Connect continua classificando os
 * assets de 13" como `APP_IPAD_PRO_3GEN_129` e os de 6.9" como `APP_IPHONE_67`.
 * Por isso o display type é o *nome da pasta*, não algo inferido no código:
 * se a Apple mudar, é só renomear a pasta. Use `npm run asc:inspect` para ver
 * exatamente quais display types a ASC já tem cadastrados neste app.
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

/** Lê largura/altura de um JPEG lendo os marcadores SOFn. */
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

/** Lê largura/altura de um PNG a partir do chunk IHDR. */
function readPngSize(buffer) {
	if (buffer.toString("ascii", 12, 16) !== "IHDR") return null;
	return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

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
 * Lê `screenshotsDir` e devolve um plano por display type, já ordenado pelo
 * nome do arquivo (por isso a convenção de prefixo numérico: `01-home.jpg`).
 * A ordem dos arquivos vira a ordem na ficha da App Store.
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
 * Valida display types e dimensões antes de qualquer chamada de rede — errar
 * isso só na hora do upload custa uma rodada inteira de workflow.
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

/** Espera a Apple terminar de processar os assets recém-enviados. */
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
 * Sincroniza os screenshots de uma localization.
 *
 * Por padrão, um display type que já tem imagens é deixado como está — ao criar
 * uma App Store Version nova a Apple copia os screenshots da versão anterior, e
 * reenviar tudo a cada release seria desperdício e risco. Use `force` para
 * substituir.
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

		// Fixa a ordem explicitamente: sem isso a ordem final depende da ordem de
		// processamento da Apple, não da ordem dos arquivos.
		await client.patch(
			`/v1/appScreenshotSets/${set.id}/relationships/appScreenshots`,
			{
				data: uploadedIds.map(id => ({ type: "appScreenshots", id })),
			},
		);

		log(`  ${displayType}: ${uploadedIds.length} screenshot(s) publicados.`);
	}
}
