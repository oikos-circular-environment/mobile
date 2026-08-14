import { eq, max } from "drizzle-orm";
import * as Crypto from "expo-crypto";
import { networkTelemetryBus } from "@/libs/network-telemetry-bus";
import { getSurveyDb } from "@/libs/survey/db/client";
import { surveyEvent } from "@/libs/survey/db/schema";
import { screenRouteBus } from "@/libs/survey/screen-route-bus";
import { uiEventBus } from "@/libs/ui-event-bus";
import { useSurveyExecutionStore } from "@/stores/survey-execution-store";

type RecorderState = {
	sessionId: string;
	suiteRunId: string;
	disposers: Array<() => void>;
};

let active: RecorderState | null = null;
const seqQueues = new Map<string, Promise<unknown>>();

function getCurrentTaskCode(): string | undefined {
	const state = useSurveyExecutionStore.getState();
	if (!state.isActive) return undefined;
	const task = state.tasks[state.currentTaskIndex];
	return task?.code;
}

async function nextSeq(sessionId: string): Promise<number> {
	const db = getSurveyDb();
	const row = await db
		.select({ value: max(surveyEvent.seq) })
		.from(surveyEvent)
		.where(eq(surveyEvent.sessionId, sessionId))
		.get();
	return (row?.value ?? 0) + 1;
}

async function persist(
	sessionId: string,
	suiteRunId: string,
	type: string,
	payload: unknown,
) {
	const db = getSurveyDb();
	const seq = await nextSeq(sessionId);
	await db.insert(surveyEvent).values({
		id: Crypto.randomUUID(),
		sessionId,
		suiteRunId,
		seq,
		type,
		taskCode: getCurrentTaskCode(),
		occurredAt: new Date().toISOString(),
		payload,
	});
}

function enqueueRecord(type: string, payload: unknown) {
	if (!active) return;
	if (!useSurveyExecutionStore.getState().isActive) return;
	const { sessionId, suiteRunId } = active;
	const previous = seqQueues.get(sessionId) ?? Promise.resolve();
	const done = previous
		.then(() => persist(sessionId, suiteRunId, type, payload))
		.finally(() => {
			if (seqQueues.get(sessionId) === done) {
				seqQueues.delete(sessionId);
			}
		});
	seqQueues.set(sessionId, done);
}

export function start(sessionId: string, suiteRunId: string) {
	stop();
	const disposers: Array<() => void> = [];

	disposers.push(
		networkTelemetryBus.subscribe(event => {
			enqueueRecord("api.call", {
				method: event.method,
				path: event.path,
				status: event.status,
				query: event.query,
			});
		}),
	);

	disposers.push(
		uiEventBus.subscribe(event => {
			enqueueRecord("ui.event", { name: event.name, ...event.payload });
		}),
	);

	disposers.push(
		screenRouteBus.subscribe(event => {
			enqueueRecord("screen.enter", { route: event.route });
		}),
	);

	active = { sessionId, suiteRunId, disposers };
}

export function stop() {
	if (!active) return;
	for (const dispose of active.disposers) dispose();
	active = null;
}
