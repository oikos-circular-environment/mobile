import { desc, eq } from "drizzle-orm";
import { getSurveyDb } from "./db/client";
import { surveySession, surveySuiteRun, surveyTaskRun } from "./db/schema";
import { getCachedProtocol } from "./protocol-cache";
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
	};
}

export async function restoreSurveySessionIfNeeded() {
	const restored = await restoreActiveSurveySession();
	if (!restored) return null;

	const cached = await getCachedProtocol(activeSession.protocolKey);
	if (cached && typeof cached.payload === "object" && cached.payload !== null) {
		const payload = cached.payload as {
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
					key: cached.key,
					suites: payload.suites,
					tasks: payload.tasks,
				},
				personaDefinition,
			});
		}
	}

	return restored;
}
