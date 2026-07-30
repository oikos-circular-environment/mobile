import { eq } from "drizzle-orm";
import { getSurveyDb } from "@/libs/survey/db/client";
import { surveySession } from "@/libs/survey/db/schema";

/**
 * Apaga a cópia local da participação. Cascata pelo schema (onDelete: "cascade")
 * cuida de suite_run, task_run, event, answer e outbox — só a linha da sessão
 * precisa ser removida explicitamente.
 */
export async function deleteLocalSurveyData(sessionId: string) {
	const db = getSurveyDb();
	await db.delete(surveySession).where(eq(surveySession.id, sessionId));
}
