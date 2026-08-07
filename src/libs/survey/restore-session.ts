import { desc, eq } from "drizzle-orm";
import { surveyClient } from "./api/client";
import { getSurveyDb } from "./db/client";
import { surveySession, surveySuiteRun, surveyTaskRun } from "./db/schema";
import { getCachedProtocol, setCachedProtocol } from "./protocol-cache";
import { restoreSurveyExecution } from "./restore-execution";

export interface RestoredSession {
	sessionId: string;
	persona: string;
	participantCode: string | null;
	status: "IN_PROGRESS" | "ABANDONED";
	currentSuiteCode: string | null;
	currentTaskCode: string | null;
	activeMs: number;
	wallMs: number;
	consentVersion: string;
	consentAt: string;
	protocolKey: string;
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
	};
}

export async function restoreSurveySessionIfNeeded() {
	const restored = await restoreLatestSurveySession();
	if (!restored) return null;

	let protocolPayload: unknown = null;
	let protocolKey = restored.protocolKey;

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
			console.warn(
				"[survey] não foi possível buscar o protocolo para restore",
				error,
			);
		}
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
