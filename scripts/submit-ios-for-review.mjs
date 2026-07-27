#!/usr/bin/env node
/**
 * @file Publica a App Store Version da `version` atual e a envia para o App
 *   Review. Idempotente: reexecutar sobre o mesmo release não duplica nada.
 *
 * Flags: `--dry-run`, `--skip-submit`, `--force-screenshots`,
 * `--build-number=<n>` (default: variável de ambiente `IOS_BUILD_NUMBER`).
 *
 * @see docs/publishing-path.md — "Envio para o App Review"
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
	AscApiError,
	createAscClient,
	getExpoVersion,
	NON_EDITABLE_VERSION_STATES,
	OPEN_REVIEW_SUBMISSION_STATES,
	readAscCredentialsFromEnv,
	sleep,
} from "./lib/asc-api.mjs";
import {
	collectScreenshots,
	syncScreenshots,
	validateScreenshots,
} from "./lib/asc-screenshots.mjs";

const STORE_DIR = join(
	dirname(fileURLToPath(import.meta.url)),
	"..",
	"store",
	"ios",
);
const PENDING_SENTINEL = "__PENDENTE__";
const BUILD_POLL_INTERVAL_MS = 30_000;

/**
 * Sinaliza que a versão já está na fila da Apple e nada resta a fazer. Tratado
 * como sucesso, para que o workflow não falhe em um release já enviado.
 */
class AlreadySubmittedError extends Error {}

const flags = {
	dryRun: process.argv.includes("--dry-run"),
	skipSubmit: process.argv.includes("--skip-submit"),
	forceScreenshots: process.argv.includes("--force-screenshots"),
	buildNumber:
		process.argv
			.find(argument => argument.startsWith("--build-number="))
			?.split("=")[1] ?? process.env.IOS_BUILD_NUMBER,
};

const step = message => console.log(`\n▸ ${message}`);
const info = message => console.log(`  ${message}`);

/**
 * @param {string} fileName Caminho relativo a `store/ios/`.
 * @returns {object}
 */
function readJson(fileName) {
	return JSON.parse(readFileSync(join(STORE_DIR, fileName), "utf-8"));
}

/**
 * Carrega e valida todos os dados do release de uma vez, antes de qualquer
 * chamada de rede, para que uma configuração incompleta não deixe a App Store
 * Version publicada pela metade.
 *
 * @param {string} version
 * @returns {{ metadata: object, reviewDetails: object, whatsNew: string,
 *   demoAccount: { name: string, password: string },
 *   screenshots: Array<{ displayType: string, files: string[] }>,
 *   warnings: string[] }}
 * @throws {Error} Listando todos os problemas encontrados.
 */
function loadReleaseConfig(version) {
	const metadata = readJson("metadata.pt-BR.json");
	const reviewDetails = readJson("review-details.json");

	let whatsNew = "";
	try {
		whatsNew = readFileSync(
			join(STORE_DIR, "whats-new", `${version}.md`),
			"utf-8",
		).trim();
	} catch {
		whatsNew = "";
	}

	const demoAccount = {
		name: process.env.ASC_DEMO_ACCOUNT_NAME ?? "",
		password: process.env.ASC_DEMO_ACCOUNT_PASSWORD ?? "",
	};

	const screenshots = collectScreenshots(join(STORE_DIR, "screenshots"));
	const problems = [];

	for (const [file, object] of [
		["metadata.pt-BR.json", metadata],
		["review-details.json", reviewDetails],
	]) {
		for (const [key, value] of Object.entries(object)) {
			if (value === PENDING_SENTINEL) {
				problems.push(
					`store/ios/${file}: "${key}" ainda está como ${PENDING_SENTINEL}.`,
				);
			}
		}
	}

	if (!whatsNew) {
		problems.push(
			`store/ios/whats-new/${version}.md não existe ou está vazio — a Apple exige "Novidades desta versão" em toda atualização.`,
		);
	}

	const warnings = [];
	if (
		reviewDetails.demoAccountRequired &&
		!(demoAccount.name && demoAccount.password)
	) {
		warnings.push(
			"ASC_DEMO_ACCOUNT_NAME/ASC_DEMO_ACCOUNT_PASSWORD não estão no ambiente — " +
				"a conta de demonstração já cadastrada na App Store Connect será mantida como está. " +
				"Para passar a gerenciá-la daqui: eas env:create production --name ASC_DEMO_ACCOUNT_NAME --type sensitive",
		);
	}

	if (screenshots.length === 0) {
		problems.push(
			"Nenhum screenshot encontrado em store/ios/screenshots/<DISPLAY_TYPE>/.",
		);
	}
	problems.push(...validateScreenshots(screenshots));

	if (problems.length > 0) {
		throw new Error(
			`Configuração do release incompleta:\n${problems.map(p => `  · ${p}`).join("\n")}`,
		);
	}

	return {
		metadata,
		reviewDetails,
		whatsNew,
		demoAccount,
		screenshots,
		warnings,
	};
}

/**
 * @param {ReturnType<import("./lib/asc-api.mjs").createAscClient>} client
 * @param {string} appId
 * @param {string} versionString
 * @returns {Promise<object|null>} A App Store Version, ou `null` se não existir.
 */
async function findAppStoreVersion(client, appId, versionString) {
	const response = await client.get(`/v1/apps/${appId}/appStoreVersions`, {
		query: {
			"filter[versionString]": versionString,
			"filter[platform]": "IOS",
			"fields[appStoreVersions]": "versionString,appVersionState,platform",
			limit: 1,
		},
	});
	return response.data[0] ?? null;
}

/**
 * Cria a App Store Version ou reutiliza a existente, quando ainda editável.
 *
 * @param {ReturnType<import("./lib/asc-api.mjs").createAscClient>} client
 * @param {string} appId
 * @param {string} versionString
 * @param {object} metadata
 * @returns {Promise<string>} O id da App Store Version.
 * @throws {AlreadySubmittedError} Se a versão já estiver na fila da Apple.
 * @throws {Error} Se a versão estiver em estado que não aceita alterações.
 */
async function ensureAppStoreVersion(client, appId, versionString, metadata) {
	const existing = await findAppStoreVersion(client, appId, versionString);

	if (existing) {
		const state = existing.attributes.appVersionState;
		if (state === "WAITING_FOR_REVIEW" || state === "IN_REVIEW") {
			throw new AlreadySubmittedError(
				`A versão ${versionString} já está na Apple (estado: ${state}) — nada a fazer.`,
			);
		}
		if (NON_EDITABLE_VERSION_STATES.has(state)) {
			throw new Error(
				`A versão ${versionString} está em "${state}" na App Store e não aceita mais alterações. ` +
					`Faça o bump de "version" no app.config.ts antes de rodar o release.`,
			);
		}
		info(
			`Versão ${versionString} já existe (estado: ${state}) — reutilizando.`,
		);
		await client.patch(`/v1/appStoreVersions/${existing.id}`, {
			data: {
				type: "appStoreVersions",
				id: existing.id,
				attributes: {
					releaseType: metadata.releaseType,
					copyright: metadata.copyright,
				},
			},
		});
		return existing.id;
	}

	const created = await client.post("/v1/appStoreVersions", {
		data: {
			type: "appStoreVersions",
			attributes: {
				platform: "IOS",
				versionString,
				releaseType: metadata.releaseType,
				copyright: metadata.copyright,
			},
			relationships: { app: { data: { type: "apps", id: appId } } },
		},
	});
	info(`Versão ${versionString} criada na App Store Connect.`);
	return created.data.id;
}

/**
 * Aguarda o build chegar a `processingState: VALID`, único estado em que a
 * Apple permite anexá-lo a uma App Store Version. A espera é necessária porque
 * o `eas submit` faz o upload com `skip_waiting_for_build_processing`.
 *
 * @param {ReturnType<import("./lib/asc-api.mjs").createAscClient>} client
 * @param {string} appId
 * @param {string} versionString Versão de marketing do trem de builds.
 * @param {string} buildNumber
 * @param {number} timeoutMinutes
 * @returns {Promise<string>} O id do build.
 * @throws {Error} Se o processamento falhar ou estourar o tempo.
 */
async function waitForBuild(
	client,
	appId,
	versionString,
	buildNumber,
	timeoutMinutes,
) {
	const deadline = Date.now() + timeoutMinutes * 60_000;
	let lastState = null;

	while (Date.now() < deadline) {
		const response = await client.get("/v1/builds", {
			query: {
				"filter[app]": appId,
				"filter[version]": buildNumber,
				"fields[builds]": "version,processingState,expired",
				include: "preReleaseVersion",
				limit: 10,
			},
		});

		const preReleaseVersions = new Map(
			(response.included ?? []).map(item => [item.id, item.attributes.version]),
		);
		const build = response.data.find(
			candidate =>
				preReleaseVersions.get(
					candidate.relationships?.preReleaseVersion?.data?.id,
				) === versionString,
		);

		if (build) {
			const state = build.attributes.processingState;
			if (state !== lastState) {
				info(`Build ${versionString} (${buildNumber}): ${state}`);
				lastState = state;
			}
			if (state === "VALID") return build.id;
			if (state === "FAILED" || state === "INVALID") {
				throw new Error(
					`Build ${versionString} (${buildNumber}) terminou o processamento como ${state} na Apple.`,
				);
			}
		} else if (lastState === null) {
			info(
				`Build ${versionString} (${buildNumber}) ainda não apareceu na App Store Connect…`,
			);
			lastState = "PENDING";
		}

		await sleep(BUILD_POLL_INTERVAL_MS);
	}

	throw new Error(
		`Timeout de ${timeoutMinutes} min esperando o build ${versionString} (${buildNumber}) ficar VALID.`,
	);
}

/**
 * Publica a metadata do idioma declarado em `metadata.locale`.
 *
 * @param {ReturnType<import("./lib/asc-api.mjs").createAscClient>} client
 * @param {string} appStoreVersionId
 * @param {{ metadata: object, whatsNew: string }} config
 * @returns {Promise<string>} O id da `appStoreVersionLocalization`.
 */
async function upsertLocalization(
	client,
	appStoreVersionId,
	{ metadata, whatsNew },
) {
	const existing = await client.get(
		`/v1/appStoreVersions/${appStoreVersionId}/appStoreVersionLocalizations`,
		{ query: { limit: 50 } },
	);
	const match = existing.data.find(
		localization => localization.attributes.locale === metadata.locale,
	);

	const attributes = {
		description: metadata.description,
		keywords: metadata.keywords,
		promotionalText: metadata.promotionalText,
		supportUrl: metadata.supportUrl,
		whatsNew,
	};
	if (metadata.marketingUrl) attributes.marketingUrl = metadata.marketingUrl;

	/** Payload alternativo: a Apple rejeita `whatsNew` na primeira versão do app. */
	const withoutWhatsNew = { ...attributes, whatsNew: undefined };

	if (match) {
		const body = extra => ({
			data: {
				type: "appStoreVersionLocalizations",
				id: match.id,
				attributes: extra,
			},
		});
		try {
			await client.patch(
				`/v1/appStoreVersionLocalizations/${match.id}`,
				body(attributes),
			);
		} catch (error) {
			if (!isWhatsNewRejection(error)) throw error;
			await client.patch(
				`/v1/appStoreVersionLocalizations/${match.id}`,
				body(withoutWhatsNew),
			);
		}
		info(`Metadata ${metadata.locale} atualizada.`);
		return match.id;
	}

	const body = extra => ({
		data: {
			type: "appStoreVersionLocalizations",
			attributes: { locale: metadata.locale, ...extra },
			relationships: {
				appStoreVersion: {
					data: { type: "appStoreVersions", id: appStoreVersionId },
				},
			},
		},
	});

	let created;
	try {
		created = await client.post(
			"/v1/appStoreVersionLocalizations",
			body(attributes),
		);
	} catch (error) {
		if (!isWhatsNewRejection(error)) throw error;
		created = await client.post(
			"/v1/appStoreVersionLocalizations",
			body(withoutWhatsNew),
		);
	}
	info(`Metadata ${metadata.locale} criada.`);
	return created.data.id;
}

/**
 * @param {unknown} error
 * @returns {boolean} `true` se a Apple recusou o campo `whatsNew`.
 */
function isWhatsNewRejection(error) {
	return (
		error instanceof AscApiError &&
		(error.body?.errors ?? []).some(item =>
			JSON.stringify(item).includes("whatsNew"),
		)
	);
}

/**
 * Publica as informações para a equipe de revisão. Campos ausentes ou vazios
 * são omitidos do payload em vez de enviados em branco, preservando o que já
 * estiver cadastrado na App Store Connect.
 *
 * @param {ReturnType<import("./lib/asc-api.mjs").createAscClient>} client
 * @param {string} appStoreVersionId
 * @param {{ reviewDetails: object, demoAccount: { name: string, password: string } }} config
 */
async function upsertReviewDetail(
	client,
	appStoreVersionId,
	{ reviewDetails, demoAccount },
) {
	const attributes = Object.fromEntries(
		Object.entries({
			contactFirstName: reviewDetails.contactFirstName,
			contactLastName: reviewDetails.contactLastName,
			contactPhone: reviewDetails.contactPhone,
			contactEmail: reviewDetails.contactEmail,
			demoAccountRequired: reviewDetails.demoAccountRequired,
			notes: reviewDetails.notes,
			...(reviewDetails.demoAccountRequired
				? {
						demoAccountName: demoAccount.name,
						demoAccountPassword: demoAccount.password,
					}
				: {}),
		}).filter(([, value]) => value !== undefined && value !== ""),
	);

	const existing = await client.getOrNull(
		`/v1/appStoreVersions/${appStoreVersionId}/appStoreReviewDetail`,
	);

	if (existing?.data) {
		await client.patch(`/v1/appStoreReviewDetails/${existing.data.id}`, {
			data: { type: "appStoreReviewDetails", id: existing.data.id, attributes },
		});
		info("Informações para a equipe de revisão atualizadas.");
		return;
	}

	await client.post("/v1/appStoreReviewDetails", {
		data: {
			type: "appStoreReviewDetails",
			attributes,
			relationships: {
				appStoreVersion: {
					data: { type: "appStoreVersions", id: appStoreVersionId },
				},
			},
		},
	});
	info("Informações para a equipe de revisão criadas.");
}

/**
 * Envia a versão para o App Review, reutilizando uma review submission aberta
 * quando já houver uma.
 *
 * @param {ReturnType<import("./lib/asc-api.mjs").createAscClient>} client
 * @param {string} appId
 * @param {string} appStoreVersionId
 * @param {string} versionString
 */
async function submitForReview(
	client,
	appId,
	appStoreVersionId,
	versionString,
) {
	const open = await client.get("/v1/reviewSubmissions", {
		query: {
			"filter[app]": appId,
			"filter[platform]": "IOS",
			"filter[state]": OPEN_REVIEW_SUBMISSION_STATES.join(","),
			limit: 10,
		},
	});

	let submission = open.data[0] ?? null;

	if (submission?.attributes.submitted) {
		info(
			`Já existe um envio em andamento (estado: ${submission.attributes.state}) — nada a fazer.`,
		);
		return;
	}

	if (!submission) {
		const created = await client.post("/v1/reviewSubmissions", {
			data: {
				type: "reviewSubmissions",
				attributes: { platform: "IOS" },
				relationships: { app: { data: { type: "apps", id: appId } } },
			},
		});
		submission = created.data;
		info("Review submission criada.");
	} else {
		info(
			`Reutilizando review submission aberta (estado: ${submission.attributes.state}).`,
		);
	}

	const items = await client.get(
		`/v1/reviewSubmissions/${submission.id}/items`,
		{
			query: { limit: 50 },
		},
	);
	const alreadyIncluded = items.data.some(
		item => item.relationships?.appStoreVersion?.data?.id === appStoreVersionId,
	);

	if (!alreadyIncluded) {
		await client.post("/v1/reviewSubmissionItems", {
			data: {
				type: "reviewSubmissionItems",
				relationships: {
					reviewSubmission: {
						data: { type: "reviewSubmissions", id: submission.id },
					},
					appStoreVersion: {
						data: { type: "appStoreVersions", id: appStoreVersionId },
					},
				},
			},
		});
		info(`Versão ${versionString} adicionada ao envio.`);
	}

	await client.patch(`/v1/reviewSubmissions/${submission.id}`, {
		data: {
			type: "reviewSubmissions",
			id: submission.id,
			attributes: { submitted: true },
		},
	});
	info(`Versão ${versionString} enviada para o App Review. 🚀`);
}

async function main() {
	const credentials = readAscCredentialsFromEnv();
	const client = createAscClient(credentials);
	const { appId } = credentials;

	const version = getExpoVersion();
	step(`Release iOS ${version}${flags.dryRun ? " (dry-run)" : ""}`);

	const config = loadReleaseConfig(version);
	info(
		`Configuração validada: ${config.screenshots
			.map(set => `${set.displayType}=${set.files.length}`)
			.join(", ")}.`,
	);
	for (const warning of config.warnings) {
		console.warn(`  ⚠ ${warning}`);
	}

	if (!flags.buildNumber) {
		throw new Error(
			"Build a anexar não informado. Use --build-number=<n> ou a env IOS_BUILD_NUMBER " +
				"(no workflow ela vem de needs.build_ios.outputs.app_build_version).",
		);
	}

	if (flags.dryRun) {
		const existing = await findAppStoreVersion(client, appId, version);
		step("Estado atual na App Store Connect");
		info(
			existing
				? `Versão ${version}: ${existing.attributes.appVersionState}`
				: `Versão ${version} ainda não existe.`,
		);
		info(`Build a anexar: ${flags.buildNumber}`);
		info("Nada foi escrito (--dry-run).");
		return;
	}

	step("App Store Version");
	const appStoreVersionId = await ensureAppStoreVersion(
		client,
		appId,
		version,
		config.metadata,
	);

	step("Build");
	const timeoutMinutes = Number(
		process.env.ASC_BUILD_WAIT_TIMEOUT_MINUTES ?? 45,
	);
	const buildId = await waitForBuild(
		client,
		appId,
		version,
		flags.buildNumber,
		timeoutMinutes,
	);
	await client.patch(
		`/v1/appStoreVersions/${appStoreVersionId}/relationships/build`,
		{
			data: { type: "builds", id: buildId },
		},
	);
	info(`Build ${version} (${flags.buildNumber}) anexado à versão.`);

	step("Metadata");
	const localizationId = await upsertLocalization(
		client,
		appStoreVersionId,
		config,
	);

	step("Screenshots");
	await syncScreenshots(client, {
		localizationId,
		sets: config.screenshots,
		force: flags.forceScreenshots,
		log: info,
	});

	step("Informações para revisão");
	await upsertReviewDetail(client, appStoreVersionId, config);

	step("App Review");
	if (flags.skipSubmit) {
		info(
			"Envio pulado (--skip-submit). A versão está pronta para revisão manual na ASC.",
		);
		return;
	}
	await submitForReview(client, appId, appStoreVersionId, version);
}

main().catch(error => {
	if (error instanceof AlreadySubmittedError) {
		console.log(`\n✓ ${error.message}`);
		return;
	}
	console.error(`\n✖ ${error.message}`);
	process.exit(1);
});
