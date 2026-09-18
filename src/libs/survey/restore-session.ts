import { desc, eq } from "drizzle-orm";
import { Observe } from "expo-observe";
import { surveyClient } from "./api/client";
import { getSurveyDb } from "./db/client";
import { surveySession, surveySuiteRun, surveyTaskRun } from "./db/schema";
import { deleteLocalSurveyData } from "./delete-local-data";
import { getCachedProtocol, setCachedProtocol } from "./protocol-cache";
import { restoreSurveyExecution } from "./restore-execution";

export interface RestoredSession {
	sessionId: string;
	persona: string;
	participantCode: string | null;
	status: "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
	currentSuiteCode: string | null;
	currentTaskCode: string | null;
	activeMs: number;
	wallMs: number;
	consentVersion: string;
	consentAt: string;
	protocolKey: string;
	protocolVersion: number;
}

export async function restoreLatestSurveySession(): Promise<RestoredSession | null> {
	const db = getSurveyDb();

	const [latestSession] = await db
		.select()
		.from(surveySession)
		.orderBy(desc(surveySession.createdAt))
		.limit(1);

	if (!latestSession) return null;

	const suites = await db
		.select()
		.from(surveySuiteRun)
		.where(eq(surveySuiteRun.sessionId, latestSession.id))
		.orderBy(surveySuiteRun.position);

	const currentSuite =
		suites.find(suite => !suite.finishedAt) ?? suites[suites.length - 1];

	let currentTaskCode: string | null = null;

	if (currentSuite) {
		const tasks = await db
			.select()
			.from(surveyTaskRun)
			.where(eq(surveyTaskRun.suiteRunId, currentSuite.id))
			.orderBy(surveyTaskRun.position);

		const currentTask =
			tasks.find(task => !task.finishedAt) ?? tasks[tasks.length - 1];
		currentTaskCode = currentTask?.taskCode ?? null;
	}

	return {
		sessionId: latestSession.id,
		persona: latestSession.persona,
		participantCode: latestSession.participantCode,
		status: latestSession.status,
		currentSuiteCode: currentSuite?.suiteCode ?? null,
		currentTaskCode,
		activeMs: latestSession.activeMs,
		wallMs: latestSession.wallMs,
		consentVersion: latestSession.consentVersion,
		consentAt: latestSession.consentAt,
		protocolKey: latestSession.protocolKey,
		protocolVersion: latestSession.protocolVersion,
	};
}

export async function restoreSurveySessionIfNeeded() {
	const restored = await restoreLatestSurveySession();
	if (!restored) return null;

	let protocolPayload: unknown = null;
	let protocolKey = restored.protocolKey;
	let protocolVersion: number | undefined;

	if (restored.status === "IN_PROGRESS") {
		try {
			const remote = await surveyClient.usability.protocol.query();
			console.log(
				"[survey] protocolo buscado do servidor (sessão em andamento):",
				Boolean(remote),
			);
			if (remote) {
				await setCachedProtocol(remote.key, remote.version, remote);
				protocolPayload = remote;
				protocolKey = remote.key;
				protocolVersion = remote.version;
			}
		} catch (error) {
			Observe.reportError(error);
			console.warn(
				"[survey] não foi possível buscar o protocolo na rede para restore de sessão em andamento — usando cache",
				error,
			);
			const cached = await getCachedProtocol(restored.protocolKey);
			console.log("[survey] cache do protocolo (fallback offline):", {
				key: restored.protocolKey,
				hit: Boolean(cached),
			});
			if (cached) {
				protocolPayload = cached.payload;
				protocolKey = cached.key;
				protocolVersion = cached.version;
			}
		}
	} else {
		const cached = await getCachedProtocol(restored.protocolKey);
		console.log("[survey] cache do protocolo:", {
			key: restored.protocolKey,
			hit: Boolean(cached),
		});
		if (cached) {
			protocolPayload = cached.payload;
			protocolKey = cached.key;
		} else {
			try {
				const remote = await surveyClient.usability.protocol.query();
				console.log("[survey] protocolo buscado do servidor:", Boolean(remote));
				if (remote) {
					await setCachedProtocol(remote.key, remote.version, remote);
					protocolPayload = remote;
					protocolKey = remote.key;
				}
			} catch (error) {
				Observe.reportError(error);
				console.warn(
					"[survey] não foi possível buscar o protocolo para restore",
					error,
				);
			}
		}
	}

	if (
		restored.status === "IN_PROGRESS" &&
		protocolVersion !== undefined &&
		protocolVersion !== restored.protocolVersion
	) {
		console.warn(
			"[survey] sessão em andamento presa a versão antiga do protocolo — descartando dados locais",
			{
				sessionId: restored.sessionId,
				sessionProtocolVersion: restored.protocolVersion,
				fetchedProtocolVersion: protocolVersion,
			},
		);
		try {
			await deleteLocalSurveyData(restored.sessionId);
		} catch (error) {
			Observe.reportError(error);
			console.warn(
				"[survey] falha ao apagar dados locais de sessão com protocolo desatualizado",
				error,
			);
		}
		return null;
	}

	if (
		protocolPayload &&
		typeof protocolPayload === "object" &&
		protocolPayload !== null
	) {
		const payload = protocolPayload as {
			personas?: Array<{
				key: string;
				suites: Array<{
					suite_code: string;
					specific_objectives: string[];
				}>;
			}>;
			suites?: Array<{
				code: string;
				title: string;
				objective: string;
				task_codes: string[];
			}>;
			tasks?: Array<{
				code: string;
				title: string;
				instruction: string;
			}>;
		};

		const personaDefinition = payload.personas?.find(
			p => p.key === restored.persona,
		);

		if (personaDefinition && payload.suites && payload.tasks) {
			await restoreSurveyExecution({
				sessionId: restored.sessionId,
				persona: restored.persona,
				protocol: {
					key: protocolKey,
					suites: payload.suites,
					tasks: payload.tasks,
				},
				personaDefinition,
			});
		}
	}

	return restored;
}
