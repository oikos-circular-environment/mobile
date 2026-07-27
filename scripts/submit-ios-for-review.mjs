#!/usr/bin/env node
// Fecha o ciclo de release do iOS.
//
// O `eas submit` roda `fastlane pilot` por baixo, que só faz upload do binário
// para a App Store Connect / TestFlight. Ele não cria a App Store Version, não
// anexa o build, não publica metadata/screenshots e não envia para o App Review
// — foi exatamente por isso que o build 1.0.1 (20) ficou parado depois de um
// workflow "verde" em 24/07/2026.
//
// Este script faz o resto, de forma idempotente (pode rodar de novo a cada push
// em `production` sem duplicar nada):
//
//   1. cria ou reutiliza a App Store Version da `version` do app.config.ts
//   2. espera o build terminar de processar e o anexa à versão
//   3. publica a metadata pt-BR (descrição, keywords, novidades da versão)
//   4. publica os screenshots de store/ios/screenshots/<DISPLAY_TYPE>/
//   5. preenche as informações para a equipe de revisão (contato + conta demo)
//   6. envia para o App Review
//
// Uso:
//   node scripts/submit-ios-for-review.mjs [flags]
//
//   --dry-run             não escreve nada; valida a configuração e mostra o
//                         estado atual na App Store Connect
//   --skip-submit         faz tudo menos o envio final (para conferir na UI)
//   --force-screenshots   substitui os screenshots já publicados na versão
//   --build-number=<n>    build a anexar (default: env IOS_BUILD_NUMBER)

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

function readJson(fileName) {
	return JSON.parse(readFileSync(join(STORE_DIR, fileName), "utf-8"));
}

/**
 * Junta tudo que o release precisa e valida de uma vez só. Falhar aqui custa
 * segundos; falhar no meio do processo deixa uma versão pela metade na ASC.
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

	if (
		reviewDetails.demoAccountRequired &&
		!(demoAccount.name && demoAccount.password)
	) {
		problems.push(
			"review-details.json pede conta de demonstração, mas ASC_DEMO_ACCOUNT_NAME/ASC_DEMO_ACCOUNT_PASSWORD não estão no ambiente. " +
				"Cadastre com: eas env:create production --name ASC_DEMO_ACCOUNT_NAME --type sensitive",
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

	return { metadata, reviewDetails, whatsNew, demoAccount, screenshots };
}

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

async function ensureAppStoreVersion(client, appId, versionString, metadata) {
	const existing = await findAppStoreVersion(client, appId, versionString);

	if (existing) {
		const state = existing.attributes.appVersionState;
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
 * O `eas submit` usa `skip_waiting_for_build_processing`, então o binário ainda
 * está sendo processado pela Apple quando este script começa. Um build só pode
 * ser anexado a uma versão depois de virar VALID.
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

	// `whatsNew` é rejeitado quando a app não tem nenhuma versão publicada antes
	// (não há "novidades" numa primeira versão). Só nesse caso reenviamos sem ele.
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

function isWhatsNewRejection(error) {
	return (
		error instanceof AscApiError &&
		(error.body?.errors ?? []).some(item =>
			JSON.stringify(item).includes("whatsNew"),
		)
	);
}

async function upsertReviewDetail(
	client,
	appStoreVersionId,
	{ reviewDetails, demoAccount },
) {
	const attributes = {
		contactFirstName: reviewDetails.contactFirstName,
		contactLastName: reviewDetails.contactLastName,
		contactPhone: reviewDetails.contactPhone,
		contactEmail: reviewDetails.contactEmail,
		demoAccountRequired: reviewDetails.demoAccountRequired,
		notes: reviewDetails.notes,
	};
	if (reviewDetails.demoAccountRequired) {
		attributes.demoAccountName = demoAccount.name;
		attributes.demoAccountPassword = demoAccount.password;
	}

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
	console.error(`\n✖ ${error.message}`);
	process.exit(1);
});
