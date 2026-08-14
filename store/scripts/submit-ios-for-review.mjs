#!/usr/bin/env node
/**
 * @file Anexa o build à App Store Version e a envia para o App Review — as duas
 *   únicas etapas do release iOS que nem o `eas submit` nem o `eas metadata:push`
 *   cobrem. Ficha, informações de revisão e screenshots são responsabilidade do
 *   EAS Metadata (`store.config.js`).
 *
 * Idempotente: reexecutar sobre o mesmo release não duplica nada.
 *
 * Identifica o build a anexar por `--build-id`/`IOS_ASC_BUILD_ID`,
 * `--build-number`/`IOS_BUILD_NUMBER`, ou nenhum dos dois — ver JSDoc de
 * `waitForBuild()` para a ordem de preferência e o fallback.
 *
 * Flags: `--dry-run`, `--skip-submit`.
 *
 * @see docs/publishing-path.md — "Publicação na App Store"
 */

import {
	appStoreVersionsBuildUpdateToOneRelationship,
	appStoreVersionsCreateInstance,
	appsAppStoreVersionsGetToManyRelated,
	buildsGetCollection,
	buildsGetInstance,
	reviewSubmissionItemsCreateInstance,
	reviewSubmissionsCreateInstance,
	reviewSubmissionsGetCollection,
	reviewSubmissionsItemsGetToManyRelated,
	reviewSubmissionsUpdateInstance,
} from "@oikos-circular-environment/apple-connect-api";
import {
	ascCall,
	createAsc,
	NON_EDITABLE_VERSION_STATES,
	OPEN_REVIEW_SUBMISSION_STATES,
	sleep,
	TRANSITIONING_REVIEW_SUBMISSION_STATES,
} from "./lib/asc.mjs";
import { getExpoVersion } from "./lib/expo-config.mjs";

const BUILD_POLL_INTERVAL_MS = 30_000;
const BUILD_NUMBER_PATTERN = /^\d+$/;

const flags = {
	dryRun: process.argv.includes("--dry-run"),
	skipSubmit: process.argv.includes("--skip-submit"),
	// || '' no workflow_dispatch (fallback do contexto app_store_connect vazio
	// em execução manual) vira string vazia, não undefined — normaliza aqui
	// pra `??` continuar funcionando em todo o resto do arquivo.
	buildId:
		(process.argv
			.find(argument => argument.startsWith("--build-id="))
			?.split("=")[1] ??
			process.env.IOS_ASC_BUILD_ID) ||
		undefined,
	buildNumber:
		(process.argv
			.find(argument => argument.startsWith("--build-number="))
			?.split("=")[1] ??
			process.env.IOS_BUILD_NUMBER) ||
		undefined,
};

const step = message => console.log(`\n▸ ${message}`);
const info = message => console.log(`  ${message}`);

/**
 * Sinaliza que a versão já está na fila da Apple e nada resta a fazer. Tratado
 * como sucesso, para que o workflow não falhe em um release já enviado.
 */
class AlreadySubmittedError extends Error {}

/**
 * @param {ReturnType<createAsc>["client"]} client
 * @param {string} appId
 * @param {string} versionString
 * @returns {Promise<object|null>} A App Store Version, ou `null` se não existir.
 */
async function findAppStoreVersion(client, appId, versionString) {
	const response = await ascCall(appsAppStoreVersionsGetToManyRelated, {
		client,
		path: { id: appId },
		query: {
			"filter[versionString]": [versionString],
			"filter[platform]": ["IOS"],
			"fields[appStoreVersions]": ["versionString", "appVersionState"],
			limit: 1,
		},
	});
	return response.data[0] ?? null;
}

/**
 * Cria a App Store Version ou reutiliza a existente, quando ainda editável. O
 * `eas metadata:push` preenche o conteúdo dela em seguida.
 *
 * @param {ReturnType<createAsc>["client"]} client
 * @param {string} appId
 * @param {string} versionString
 * @returns {Promise<string>} O id da App Store Version.
 * @throws {AlreadySubmittedError} Se a versão já estiver na fila da Apple.
 * @throws {Error} Se a versão estiver em estado que não aceita alterações.
 */
async function ensureAppStoreVersion(client, appId, versionString) {
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
		return existing.id;
	}

	const created = await ascCall(appStoreVersionsCreateInstance, {
		client,
		body: {
			data: {
				type: "appStoreVersions",
				attributes: { platform: "IOS", versionString },
				relationships: { app: { data: { type: "apps", id: appId } } },
			},
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
 * `buildNumber` é opcional: sem ele, o filtro cai só em `filter[app]`,
 * ordenado por `-uploadedDate`, e casa pelo trem — pega o build mais
 * recente da versão em vez de um só já identificado.
 *
 * @param {ReturnType<createAsc>["client"]} client
 * @param {string} appId
 * @param {string} versionString Versão de marketing do trem de builds.
 * @param {string|undefined} buildNumber
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
	const label = buildNumber
		? `${versionString} (${buildNumber})`
		: versionString;

	while (Date.now() < deadline) {
		const response = await ascCall(buildsGetCollection, {
			client,
			query: {
				"filter[app]": [appId],
				...(buildNumber ? { "filter[version]": [buildNumber] } : {}),
				// preReleaseVersion precisa estar em fields[builds], não só em
				// include — sparse fieldset também filtra relationships, e sem
				// isso response.data[].relationships.preReleaseVersion vem
				// undefined e o build nunca casa com o trem.
				"fields[builds]": ["version", "processingState", "preReleaseVersion"],
				include: ["preReleaseVersion"],
				limit: 10,
				sort: ["-uploadedDate"],
			},
		});

		const trains = new Map(
			(response.included ?? []).map(item => [item.id, item.attributes.version]),
		);
		const build = response.data.find(
			candidate =>
				trains.get(candidate.relationships?.preReleaseVersion?.data?.id) ===
				versionString,
		);

		if (build) {
			const state = build.attributes.processingState;
			if (state !== lastState) {
				info(`Build ${label}: ${state}`);
				lastState = state;
			}
			if (state === "VALID") return build.id;
			if (state === "FAILED" || state === "INVALID") {
				throw new Error(
					`Build ${label} terminou o processamento como ${state} na Apple.`,
				);
			}
		} else if (lastState === null) {
			info(`Build ${label} ainda não apareceu na App Store Connect…`);
			lastState = "PENDING";
		}

		await sleep(BUILD_POLL_INTERVAL_MS);
	}

	throw new Error(
		`Timeout de ${timeoutMinutes} min esperando o build ${label} ficar VALID.`,
	);
}

/**
 * Confirma que um build já identificado por id chegou a `processingState:
 * VALID`. Mais curto que `waitForBuild`: quando o id vem do trigger
 * `app_store_connect.build_upload` (estado `complete`), a Apple já terminou —
 * ou está prestes a terminar — de processar o upload.
 *
 * @param {ReturnType<createAsc>["client"]} client
 * @param {string} buildId
 * @param {number} timeoutMinutes
 * @throws {Error} Se o processamento falhar ou estourar o tempo.
 */
async function waitForBuildById(client, buildId, timeoutMinutes) {
	const deadline = Date.now() + timeoutMinutes * 60_000;
	let lastState = null;

	while (Date.now() < deadline) {
		const response = await ascCall(buildsGetInstance, {
			client,
			path: { id: buildId },
			query: { "fields[builds]": ["processingState"] },
		});
		const state = response.data.attributes.processingState;

		if (state !== lastState) {
			info(`Build ${buildId}: ${state}`);
			lastState = state;
		}
		if (state === "VALID") return;
		if (state === "FAILED" || state === "INVALID") {
			throw new Error(
				`Build ${buildId} terminou o processamento como ${state} na Apple.`,
			);
		}

		await sleep(BUILD_POLL_INTERVAL_MS);
	}

	throw new Error(
		`Timeout de ${timeoutMinutes} min esperando o build ${buildId} ficar VALID.`,
	);
}

/**
 * Envia a versão para o App Review, reutilizando uma review submission aberta
 * quando já houver uma.
 *
 * @param {ReturnType<createAsc>["client"]} client
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
	const open = await ascCall(reviewSubmissionsGetCollection, {
		client,
		query: {
			"filter[app]": [appId],
			"filter[platform]": ["IOS"],
			"filter[state]": OPEN_REVIEW_SUBMISSION_STATES,
			limit: 10,
		},
	});

	let submission = open.data[0] ?? null;

	if (
		submission &&
		TRANSITIONING_REVIEW_SUBMISSION_STATES.includes(submission.attributes.state)
	) {
		throw new Error(
			`Review submission em transição (estado: ${submission.attributes.state}) — ` +
				"a Apple ainda está cancelando ou finalizando o envio anterior. Espere " +
				"terminar e rode de novo.",
		);
	}

	// `submitted` não é atributo de leitura do ReviewSubmission — só existe no
	// corpo do PATCH. READY_FOR_REVIEW é o único estado aberto em que ainda não
	// foi marcado; qualquer outro já passou por isso.
	if (submission && submission.attributes.state !== "READY_FOR_REVIEW") {
		info(
			`Já existe um envio em andamento (estado: ${submission.attributes.state}) — nada a fazer.`,
		);
		return;
	}

	if (submission) {
		info(
			`Reutilizando review submission aberta (estado: ${submission.attributes.state}).`,
		);
	} else {
		const created = await ascCall(reviewSubmissionsCreateInstance, {
			client,
			body: {
				data: {
					type: "reviewSubmissions",
					attributes: { platform: "IOS" },
					relationships: { app: { data: { type: "apps", id: appId } } },
				},
			},
		});
		submission = created.data;
		info("Review submission criada.");
	}

	const items = await ascCall(reviewSubmissionsItemsGetToManyRelated, {
		client,
		path: { id: submission.id },
		query: { limit: 50 },
	});
	const alreadyIncluded = items.data.some(
		item => item.relationships?.appStoreVersion?.data?.id === appStoreVersionId,
	);

	if (!alreadyIncluded) {
		await ascCall(reviewSubmissionItemsCreateInstance, {
			client,
			body: {
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
			},
		});
		info(`Versão ${versionString} adicionada ao envio.`);
	}

	await ascCall(reviewSubmissionsUpdateInstance, {
		client,
		path: { id: submission.id },
		body: {
			data: {
				type: "reviewSubmissions",
				id: submission.id,
				attributes: { submitted: true },
			},
		},
	});
	info(`Versão ${versionString} enviada para o App Review. 🚀`);
}

async function main() {
	const { appId, client } = createAsc();
	const version = getExpoVersion();

	step(`Release iOS ${version}${flags.dryRun ? " (dry-run)" : ""}`);

	if (
		flags.buildNumber &&
		!BUILD_NUMBER_PATTERN.test(String(flags.buildNumber))
	) {
		throw new Error(
			`--build-number recebeu "${flags.buildNumber}", que não é um número. ` +
				"Isso normalmente indica uma expressão needs.*.outputs não interpolada — " +
				"confira se o `env` que a define está no nível do job, não de um step " +
				"individual (ver docs/publishing-path.md).",
		);
	}

	if (flags.dryRun) {
		const existing = await findAppStoreVersion(client, appId, version);
		info(
			existing
				? `Versão ${version}: ${existing.attributes.appVersionState}`
				: `Versão ${version} ainda não existe.`,
		);
		info(
			`Build a anexar: ${flags.buildId ?? flags.buildNumber ?? `(a localizar por ${version})`}`,
		);
		info("Nada foi escrito (--dry-run).");
		return;
	}

	step("App Store Version");
	const appStoreVersionId = await ensureAppStoreVersion(client, appId, version);

	step("Build");
	let buildId;
	if (flags.buildId) {
		const timeoutMinutes = Number(
			process.env.ASC_BUILD_WAIT_TIMEOUT_MINUTES ?? 10,
		);
		await waitForBuildById(client, flags.buildId, timeoutMinutes);
		buildId = flags.buildId;
	} else {
		const timeoutMinutes = Number(
			process.env.ASC_BUILD_WAIT_TIMEOUT_MINUTES ?? 45,
		);
		buildId = await waitForBuild(
			client,
			appId,
			version,
			flags.buildNumber,
			timeoutMinutes,
		);
	}
	await ascCall(appStoreVersionsBuildUpdateToOneRelationship, {
		client,
		path: { id: appStoreVersionId },
		body: { data: { type: "builds", id: buildId } },
	});
	info(
		`Build ${version} (${flags.buildId ?? flags.buildNumber ?? buildId}) anexado à versão.`,
	);

	step("App Review");
	if (flags.skipSubmit) {
		info(
			"Envio pulado (--skip-submit). Rode `eas metadata:push` e envie manualmente pela ASC.",
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
