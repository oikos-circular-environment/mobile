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

export async function restoreActiveSurveySession(): Promise<RestoredSession | null> {
	const db = getSurveyDb();

	const [activeSession] = await db
		.select()
		.from(surveySession)
		.where(eq(surveySession.status, "IN_PROGRESS"))
		.orderBy(desc(surveySession.createdAt))
		.limit(1);

	if (!activeSession) return null;

	const suites = await db
		.select()
		.from(surveySuiteRun)
		.where(eq(surveySuiteRun.sessionId, activeSession.id))
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
		sessionId: activeSession.id,
		persona: activeSession.persona,
		participantCode: activeSession.participantCode,
		status: activeSession.status,
		currentSuiteCode: currentSuite?.suiteCode ?? null,
		currentTaskCode,
		activeMs: activeSession.activeMs,
		wallMs: activeSession.wallMs,
		consentVersion: activeSession.consentVersion,
		consentAt: activeSession.consentAt,
		protocolKey: activeSession.protocolKey,
	};
}

export async function restoreSurveySessionIfNeeded() {
	const restored = await restoreActiveSurveySession();
	if (!restored) return null;

	let protocolPayload: unknown = null;
	let protocolKey = restored.protocolKey;

	const cached = await getCachedProtocol(restored.protocolKey);
	if (cached) {
		protocolPayload = cached.payload;
		protocolKey = cached.key;
	} else {
		try {
			const remote = await surveyClient.usability.protocol.query();
			if (remote) {
				await setCachedProtocol(
					remote.protocol_key,
					remote.protocol_version,
					remote,
				);
				protocolPayload = remote;
				protocolKey = remote.protocol_key;
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
