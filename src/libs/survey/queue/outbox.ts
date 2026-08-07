import type { AppRouter } from "@oikos-circular-environment/survey-api/routers/index";
import type { inferRouterInputs } from "@trpc/server";
import { and, asc, eq, inArray, isNull, lt, sql } from "drizzle-orm";
import * as Crypto from "expo-crypto";
import { useSurveyExecutionStore } from "@/stores/survey-execution-store";
import { surveyClient } from "../api/client";
import { getSurveyDb } from "../db/client";
import { surveyEvent, surveyOutbox, surveySession } from "../db/schema";

type RouterInputs = inferRouterInputs<AppRouter>;
type UsabilityInputs = RouterInputs["usability"];

type OutboxKind = "E2_SESSION" | "E3_CHECKPOINT" | "E4_FINISH" | "E5_ABANDON";

const MAX_CHUNK_BYTES = 256_000;
const STALE_SENDING_MS = 60_000;
const BACKOFF_BASE_MS = 20_000;
const BACKOFF_MAX_MS = 300_000;
const BACKOFF_MAX_ATTEMPTS = 10;

function nowIso() {
	return new Date().toISOString();
}

function isBackoffExpired(item: typeof surveyOutbox.$inferSelect): boolean {
	if (item.status !== "FAILED") return true;
	if (item.attempts >= BACKOFF_MAX_ATTEMPTS) return false;
	const backoffMs = Math.min(
		BACKOFF_BASE_MS * 2 ** item.attempts,
		BACKOFF_MAX_MS,
	);
	const updatedAt = new Date(item.updatedAt).getTime();
	return Date.now() >= updatedAt + backoffMs;
}

async function reconcileStaleSendingItems(
	db: ReturnType<typeof getSurveyDb>,
	sessionId: string,
) {
	const threshold = new Date(Date.now() - STALE_SENDING_MS).toISOString();
	await db
		.update(surveyOutbox)
		.set({ status: "PENDING", updatedAt: nowIso() })
		.where(
			and(
				eq(surveyOutbox.sessionId, sessionId),
				eq(surveyOutbox.status, "SENDING"),
				lt(surveyOutbox.updatedAt, threshold),
			),
		);
}

async function enqueue(
	sessionId: string,
	kind: OutboxKind,
	payload: unknown,
	extra?: { suiteCode?: string; chunkIndex?: number; chunkTotal?: number },
) {
	const db = getSurveyDb();
	const timestamp = nowIso();
	await db.insert(surveyOutbox).values({
		id: Crypto.randomUUID(),
		sessionId,
		kind,
		suiteCode: extra?.suiteCode,
		chunkIndex: extra?.chunkIndex,
		chunkTotal: extra?.chunkTotal,
		payload,
		status: "PENDING",
		attempts: 0,
		createdAt: timestamp,
		updatedAt: timestamp,
	});
}

export function enqueueSessionUpsert(
	sessionId: string,
	input: UsabilityInputs["session"]["upsert"],
) {
	return enqueue(sessionId, "E2_SESSION", input);
}

export function enqueueFinish(
	sessionId: string,
	input: UsabilityInputs["finish"],
) {
	return enqueue(sessionId, "E4_FINISH", input);
}

export function enqueueAbandon(
	sessionId: string,
	input: UsabilityInputs["abandon"],
) {
	return enqueue(sessionId, "E5_ABANDON", input);
}

type CheckpointEvent = NonNullable<
	UsabilityInputs["checkpoint"]["send"]["events"]
>[number];

type CheckpointPayload = {
	session_id: string;
	suite: UsabilityInputs["checkpoint"]["send"]["suite"];
	tasks?: UsabilityInputs["checkpoint"]["send"]["tasks"];
	answers?: UsabilityInputs["checkpoint"]["send"]["answers"];
};

type CheckpointOutboxPayload = {
	input: UsabilityInputs["checkpoint"]["send"];
	eventIds: string[];
	localSuiteRunId: string;
};

function chunkEvents(events: CheckpointEvent[]): CheckpointEvent[][] {
	if (events.length === 0) return [[]];
	const chunks: CheckpointEvent[][] = [];
	let current: CheckpointEvent[] = [];
	for (const event of events) {
		const candidate = [...current, event];
		if (
			JSON.stringify(candidate).length > MAX_CHUNK_BYTES &&
			current.length > 0
		) {
			chunks.push(current);
			current = [event];
		} else {
			current = candidate;
		}
	}
	if (current.length > 0) chunks.push(current);
	return chunks;
}

async function loadPendingEvents(
	sessionId: string,
	suiteRunId: string,
	suiteCode: string,
): Promise<{ events: CheckpointEvent[]; eventIds: string[] }> {
	const db = getSurveyDb();
	const rows = await db
		.select({
			id: surveyEvent.id,
			seq: surveyEvent.seq,
			type: surveyEvent.type,
			taskCode: surveyEvent.taskCode,
			occurredAt: surveyEvent.occurredAt,
			payload: surveyEvent.payload,
		})
		.from(surveyEvent)
		.where(
			and(
				eq(surveyEvent.sessionId, sessionId),
				eq(surveyEvent.suiteRunId, suiteRunId),
				isNull(surveyEvent.sentAt),
			),
		)
		.orderBy(asc(surveyEvent.seq))
		.all();

	const events = rows.map(row => ({
		client_event_id: row.id,
		seq: row.seq,
		type: row.type,
		suite_code: suiteCode,
		task_code: row.taskCode ?? undefined,
		occurred_at: row.occurredAt,
		payload: (row.payload as Record<string, unknown>) ?? {},
	}));

	return { events, eventIds: rows.map(row => row.id) };
}

export async function enqueueCheckpoint(
	sessionId: string,
	suiteRunId: string | undefined,
	input: CheckpointPayload,
) {
	const { events, eventIds } = suiteRunId
		? await loadPendingEvents(sessionId, suiteRunId, input.suite.code)
		: { events: [] as CheckpointEvent[], eventIds: [] as string[] };
	const chunks = chunkEvents(events);
	const total = chunks.length;
	for (let index = 0; index < total; index += 1) {
		const chunkEvents = chunks[index];
		const chunkEventIds = chunkEventIdsForChunk(eventIds, events, chunkEvents);
		const fullInput: UsabilityInputs["checkpoint"]["send"] = {
			...input,
			...(suiteRunId ? { suite_run_id: suiteRunId } : {}),
			chunk: { index, total },
			events: chunkEvents,
		};
		await enqueue(
			sessionId,
			"E3_CHECKPOINT",
			{
				input: fullInput,
				eventIds: chunkEventIds,
				localSuiteRunId: suiteRunId ?? "",
			} satisfies CheckpointOutboxPayload,
			{ suiteCode: input.suite.code, chunkIndex: index, chunkTotal: total },
		);
	}
}

function chunkEventIdsForChunk(
	allEventIds: string[],
	allEvents: CheckpointEvent[],
	chunk: CheckpointEvent[],
): string[] {
	const ids: string[] = [];
	for (let i = 0; i < allEvents.length; i += 1) {
		if (chunk.includes(allEvents[i])) {
			ids.push(allEventIds[i]);
		}
	}
	return ids;
}

async function reconcileSuiteRunId(localId: string, effectiveId: string) {
	if (localId === effectiveId) return;
	const db = getSurveyDb();
	await db.run(sql`PRAGMA foreign_keys = OFF`);
	try {
		await db.run(
			sql`UPDATE survey_task_run SET suite_run_id = ${effectiveId} WHERE suite_run_id = ${localId}`,
		);
		await db.run(
			sql`UPDATE survey_answer SET suite_run_id = ${effectiveId} WHERE suite_run_id = ${localId}`,
		);
		await db.run(
			sql`UPDATE survey_event SET suite_run_id = ${effectiveId} WHERE suite_run_id = ${localId}`,
		);
		await db.run(
			sql`UPDATE survey_suite_run SET id = ${effectiveId} WHERE id = ${localId}`,
		);
	} finally {
		await db.run(sql`PRAGMA foreign_keys = ON`);
	}
	useSurveyExecutionStore.getState().setSuiteRunId(effectiveId);
}

async function sendOutboxItem(item: typeof surveyOutbox.$inferSelect) {
	const db = getSurveyDb();
	await db
		.update(surveyOutbox)
		.set({ status: "SENDING", updatedAt: nowIso() })
		.where(eq(surveyOutbox.id, item.id));

	try {
		switch (item.kind as OutboxKind) {
			case "E2_SESSION": {
				const result = await surveyClient.usability.session.upsert.mutate(
					item.payload as UsabilityInputs["session"]["upsert"],
				);
				await db
					.update(surveySession)
					.set({ participantCode: result.participant_code })
					.where(eq(surveySession.id, item.sessionId));
				break;
			}
			case "E3_CHECKPOINT": {
				const { input, eventIds, localSuiteRunId } =
					item.payload as CheckpointOutboxPayload;
				const result =
					await surveyClient.usability.checkpoint.send.mutate(input);
				if (result.suite_run_id && result.suite_run_id !== localSuiteRunId) {
					await reconcileSuiteRunId(localSuiteRunId, result.suite_run_id);
				}
				const sentAt = nowIso();
				for (const eventId of eventIds) {
					await db
						.update(surveyEvent)
						.set({ sentAt })
						.where(eq(surveyEvent.id, eventId));
				}
				break;
			}
			case "E4_FINISH": {
				const result = await surveyClient.usability.finish.mutate(
					item.payload as UsabilityInputs["finish"],
				);
				await db
					.update(surveySession)
					.set({
						participantCode: result.participant_code,
						status: "COMPLETED",
					})
					.where(eq(surveySession.id, item.sessionId));
				break;
			}
			case "E5_ABANDON":
				await surveyClient.usability.abandon.mutate(
					item.payload as UsabilityInputs["abandon"],
				);
				break;
		}
		await db
			.update(surveyOutbox)
			.set({ status: "SENT", updatedAt: nowIso() })
			.where(eq(surveyOutbox.id, item.id));
		return true;
	} catch (error) {
		await db
			.update(surveyOutbox)
			.set({
				status: "FAILED",
				attempts: item.attempts + 1,
				lastError: error instanceof Error ? error.message : String(error),
				updatedAt: nowIso(),
			})
			.where(eq(surveyOutbox.id, item.id));
		return false;
	}
}

export async function drainOutbox(sessionId: string): Promise<void> {
	const db = getSurveyDb();
	await reconcileStaleSendingItems(db, sessionId);

	const pending = await db
		.select()
		.from(surveyOutbox)
		.where(
			and(
				eq(surveyOutbox.sessionId, sessionId),
				inArray(surveyOutbox.status, ["PENDING", "FAILED"]),
			),
		)
		.orderBy(asc(surveyOutbox.createdAt));

	const sessionItems = pending.filter(item => item.kind === "E2_SESSION");
	const otherItems = pending.filter(item => item.kind !== "E2_SESSION");

	for (const item of [...sessionItems, ...otherItems]) {
		if (!isBackoffExpired(item)) continue;
		await sendOutboxItem(item);
	}
}
