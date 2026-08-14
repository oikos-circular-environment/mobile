import { and, eq } from "drizzle-orm";
import * as Crypto from "expo-crypto";
import { getSurveyDb } from "@/libs/survey/db/client";
import { surveyTaskRun } from "@/libs/survey/db/schema";

async function findTaskRun(suiteRunId: string, taskCode: string) {
	const rows = await getSurveyDb()
		.select()
		.from(surveyTaskRun)
		.where(
			and(
				eq(surveyTaskRun.suiteRunId, suiteRunId),
				eq(surveyTaskRun.taskCode, taskCode),
			),
		);
	return rows[0] ?? null;
}

/**
 * Usado pelo watcher de detecção ao ativar uma tarefa como "current". Reaproveita a linha
 * se ela já existir (tarefa que voltou de "skipped") — nunca insere duplicata, o que
 * violaria o índice único `(suiteRunId, taskCode)`.
 */
export async function getOrCreateOpenTaskRun(
	suiteRunId: string,
	taskCode: string,
	position: number,
): Promise<{ id: string; activeMs: number }> {
	const existing = await findTaskRun(suiteRunId, taskCode);
	if (existing) return { id: existing.id, activeMs: existing.activeMs };

	const id = Crypto.randomUUID();
	await getSurveyDb().insert(surveyTaskRun).values({
		id,
		suiteRunId,
		taskCode,
		position,
		startedAt: new Date().toISOString(),
	});
	return { id, activeMs: 0 };
}

/**
 * Usado pelos caminhos de abandono manual (tarefa individual ou suíte inteira). Upsert: se
 * a linha já existe (tarefa que já tinha ficado "current" alguma vez), atualiza
 * outcome/finishedAt preservando o `startedAt` original. Se nunca existiu (tarefa ainda
 * "pending", nunca ficou "current" — caso de abandono de suíte), cria uma linha nova com
 * `started_at = finished_at = agora`.
 */
export async function resolveTaskRun(
	suiteRunId: string,
	taskCode: string,
	position: number,
	outcome: "YES" | "NO",
	activeMsDelta = 0,
): Promise<void> {
	const now = new Date().toISOString();
	const db = getSurveyDb();
	const existing = await findTaskRun(suiteRunId, taskCode);

	if (existing) {
		await db
			.update(surveyTaskRun)
			.set({
				finishedAt: existing.finishedAt ?? now,
				activeMs: existing.activeMs + activeMsDelta,
				outcome,
				autoDetected: false,
			})
			.where(eq(surveyTaskRun.id, existing.id));
		return;
	}

	await db.insert(surveyTaskRun).values({
		id: Crypto.randomUUID(),
		suiteRunId,
		taskCode,
		position,
		startedAt: now,
		finishedAt: now,
		activeMs: activeMsDelta,
		outcome,
		autoDetected: false,
	});
}
