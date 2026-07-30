import type { AppRouter } from "@oikos-circular-environment/survey-api/routers/index";
import type { inferRouterInputs } from "@trpc/server";
import { and, asc, eq, inArray } from "drizzle-orm";
import * as Crypto from "expo-crypto";
import { surveyClient } from "../api/client";
import { getSurveyDb } from "../db/client";
import { surveyOutbox } from "../db/schema";

type RouterInputs = inferRouterInputs<AppRouter>;
type UsabilityInputs = RouterInputs["usability"];

type OutboxKind = "E2_SESSION" | "E3_CHECKPOINT" | "E4_FINISH" | "E5_ABANDON";

const MAX_CHUNK_BYTES = 256_000;

function nowIso() {
	return new Date().toISOString();
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

export async function enqueueCheckpoint(
	sessionId: string,
	input: UsabilityInputs["checkpoint"]["send"],
) {
	const chunks = chunkEvents(input.events ?? []);
	const total = chunks.length;
	for (let index = 0; index < total; index += 1) {
		await enqueue(
			sessionId,
			"E3_CHECKPOINT",
			{
				...input,
				chunk: { index, total },
				events: chunks[index],
			},
			{ suiteCode: input.suite.code, chunkIndex: index, chunkTotal: total },
		);
	}
}

async function sendOutboxItem(item: typeof surveyOutbox.$inferSelect) {
	const db = getSurveyDb();
	await db
		.update(surveyOutbox)
		.set({ status: "SENDING", updatedAt: nowIso() })
		.where(eq(surveyOutbox.id, item.id));

	try {
		switch (item.kind as OutboxKind) {
			case "E2_SESSION":
				await surveyClient.usability.session.upsert.mutate(
					item.payload as UsabilityInputs["session"]["upsert"],
				);
				break;
			case "E3_CHECKPOINT":
				await surveyClient.usability.checkpoint.send.mutate(
					item.payload as UsabilityInputs["checkpoint"]["send"],
				);
				break;
			case "E4_FINISH":
				await surveyClient.usability.finish.mutate(
					item.payload as UsabilityInputs["finish"],
				);
				break;
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
		const sent = await sendOutboxItem(item);
		if (!sent) return;
	}
}
