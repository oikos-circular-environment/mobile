import { eq } from "drizzle-orm";
import { getSurveyDb } from "@/libs/survey/db/client";
import { surveySession, surveySuiteRun } from "@/libs/survey/db/schema";

export async function sessionTotals(
	sessionId: string,
	finishedAt: string,
): Promise<{ activeMs: number; wallMs: number }> {
	const db = getSurveyDb();

	const session = await db
		.select({ startedAt: surveySession.startedAt })
		.from(surveySession)
		.where(eq(surveySession.id, sessionId))
		.then(rows => rows[0]);

	const runs = await db
		.select({ activeMs: surveySuiteRun.activeMs })
		.from(surveySuiteRun)
		.where(eq(surveySuiteRun.sessionId, sessionId));

	const activeMs = runs.reduce((total, run) => total + run.activeMs, 0);
	const wallMs = session
		? Math.max(
				0,
				new Date(finishedAt).getTime() - new Date(session.startedAt).getTime(),
			)
		: activeMs;

	return { activeMs, wallMs };
}
