import {
	surveyAnswer,
	surveyEvent,
	surveySession,
	surveySuiteRun,
	surveyTaskRun,
} from "@/libs/survey/db/schema";
import { createTestSurveyDb } from "@/libs/survey/db/test-client";

const mockDb = createTestSurveyDb();

jest.mock("@/libs/survey/db/client", () => ({
	getSurveyDb: () => mockDb,
}));

const mockUpsert = jest.fn();
const mockCheckpoint = jest.fn();

jest.mock("@/libs/survey/api/client", () => ({
	surveyClient: {
		usability: {
			session: {
				upsert: { mutate: (...args: unknown[]) => mockUpsert(...args) },
			},
			checkpoint: {
				send: { mutate: (...args: unknown[]) => mockCheckpoint(...args) },
			},
			finish: { mutate: jest.fn() },
			abandon: { mutate: jest.fn() },
		},
	},
}));

jest.mock("@/stores/survey-execution-store", () => ({
	useSurveyExecutionStore: {
		getState: () => ({ setSuiteRunId: jest.fn() }),
		setState: jest.fn(),
	},
}));

import { asc, eq } from "drizzle-orm";
import { surveyOutbox } from "@/libs/survey/db/schema";
import {
	drainOutbox,
	enqueueCheckpoint,
	enqueueSessionUpsert,
} from "@/libs/survey/queue/outbox";
import { useSurveyStore } from "@/stores/survey-store";

const now = "2026-08-15T17:33:02.000Z";

function insertSession(id = "session-1") {
	mockDb
		.insert(surveySession)
		.values({
			id,
			protocolKey: "oikos-walkthrough",
			protocolVersion: 1,
			persona: "COLLECTOR",
			stateUf: "MT",
			cityName: "Rondonópolis",
			ageRange: "AGE_35_44",
			educationLevel: "HIGHSCHOOL_COMPLETE",
			chainRole: "INDEPENDENT_COLLECTOR",
			wasteContactFrequency: 5,
			appExperience: 3,
			consentVersion: "2026-08-01",
			consentAt: now,
			deviceOs: "android",
			deviceOsVersion: "14",
			appVersion: "1.0.1",
			screenSize: "SMALL",
			startedAt: now,
			createdAt: now,
			updatedAt: now,
		})
		.run();
}

function insertSuiteRun(id = "suite-run-1", sessionId = "session-1") {
	mockDb
		.insert(surveySuiteRun)
		.values({
			id,
			sessionId,
			suiteCode: "S1",
			position: 0,
			startedAt: now,
		})
		.run();
}

function insertEvent(
	id: string,
	seq: number,
	payload: unknown = { route: "/market" },
	suiteRunId: string = "suite-run-1",
	sentAt: string | null = null,
) {
	mockDb
		.insert(surveyEvent)
		.values({
			id,
			sessionId: "session-1",
			suiteRunId,
			seq,
			type: "screen.enter",
			occurredAt: now,
			payload,
			...(sentAt ? { sentAt } : {}),
		})
		.run();
}

function baseCheckpointInput() {
	return {
		session_id: "session-1",
		suite: {
			code: "S1",
			position: 0,
			started_at: now,
			active_ms: 1000,
			wall_ms: 1000,
		},
		tasks: [],
		answers: [],
	};
}

function sessionUpsertInput(): Parameters<typeof enqueueSessionUpsert>[1] {
	return {
		session_id: "session-1",
		protocol_key: "oikos-walkthrough",
		protocol_version: 1,
		persona: "COLLECTOR",
		screener: {
			state_uf: "MT",
			city_name: "Rondonópolis",
			age_range: "AGE_35_44",
			education_level: "HIGHSCHOOL_COMPLETE",
			chain_role: "INDEPENDENT_COLLECTOR",
			waste_contact_frequency: 5,
			app_experience: 3,
		},
		consent: { version: "2026-08-01", accepted_at: now },
		device: {
			os: "android",
			os_version: "14",
			app_version: "1.0.1",
			screen_size: "SMALL",
		},
		started_at: now,
	};
}

describe("fila de envio do modo pesquisa", () => {
	beforeEach(() => {
		useSurveyStore.getState().reset();
		mockDb.delete(surveyOutbox).run();
		mockDb.delete(surveyEvent).run();
		mockDb.delete(surveyAnswer).run();
		mockDb.delete(surveyTaskRun).run();
		mockDb.delete(surveySuiteRun).run();
		mockDb.delete(surveySession).run();
		mockUpsert.mockReset();
		mockCheckpoint.mockReset();
		mockUpsert.mockResolvedValue({
			session_id: "session-1",
			participant_code: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
			protocol_version: 1,
		});
		mockCheckpoint.mockResolvedValue({
			session_id: "session-1",
			suite_code: "S1",
			chunk_index: 0,
			received_events: 0,
			suite_complete: true,
			suite_run_id: "suite-run-1",
		});
	});

	it("fatia os eventos do checkpoint quando o payload passa do teto", async () => {
		insertSession();
		insertSuiteRun();
		for (let i = 0; i < 3000; i += 1) {
			insertEvent(`event-${i}`, i, { route: "/market" });
		}

		await enqueueCheckpoint("session-1", "suite-run-1", baseCheckpointInput());

		const rows = mockDb.select().from(surveyOutbox).all();
		expect(rows.length).toBeGreaterThan(1);
		expect(rows[0]?.chunkTotal).toBe(rows.length);
	});

	it("drainOutbox sempre envia E2_SESSION pendente antes de qualquer outro item, mesmo enfileirado depois", async () => {
		insertSession();

		await enqueueCheckpoint("session-1", undefined, baseCheckpointInput());
		await enqueueSessionUpsert("session-1", sessionUpsertInput());

		const order: string[] = [];
		mockUpsert.mockImplementationOnce(async () => {
			order.push("E2_SESSION");
			return {
				session_id: "session-1",
				participant_code: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
				protocol_version: 1,
			};
		});
		mockCheckpoint.mockImplementationOnce(async () => {
			order.push("E3_CHECKPOINT");
			return {
				session_id: "session-1",
				suite_code: "S1",
				chunk_index: 0,
				received_events: 0,
				suite_complete: true,
			};
		});

		await drainOutbox("session-1");

		expect(order).toEqual(["E2_SESSION", "E3_CHECKPOINT"]);
	});

	it("não reenvia um item já marcado como SENT", async () => {
		insertSession();
		await enqueueSessionUpsert("session-1", sessionUpsertInput());

		await drainOutbox("session-1");
		expect(mockUpsert).toHaveBeenCalledTimes(1);

		await drainOutbox("session-1");
		expect(mockUpsert).toHaveBeenCalledTimes(1);
	});

	it("marca o item como FAILED e para de drenar quando o envio falha", async () => {
		insertSession();
		await enqueueSessionUpsert("session-1", sessionUpsertInput());

		mockUpsert.mockRejectedValueOnce(new Error("network down"));
		await drainOutbox("session-1");

		const [row] = mockDb.select().from(surveyOutbox).all();
		expect(row?.status).toBe("FAILED");
		expect(row?.attempts).toBe(1);
	});

	it("dois envios seguidos não repetem evento", async () => {
		insertSession();
		insertSuiteRun();
		insertEvent("event-1", 1);

		mockCheckpoint.mockResolvedValue({
			session_id: "session-1",
			suite_code: "S1",
			chunk_index: 0,
			received_events: 1,
			suite_complete: true,
		});

		await enqueueCheckpoint("session-1", "suite-run-1", baseCheckpointInput());
		await drainOutbox("session-1");

		expect(mockCheckpoint).toHaveBeenCalledTimes(1);
		expect(
			(mockCheckpoint.mock.calls[0] as [{ events: unknown[] }])[0].events,
		).toHaveLength(1);

		mockCheckpoint.mockClear();
		await enqueueCheckpoint("session-1", "suite-run-1", baseCheckpointInput());
		await drainOutbox("session-1");

		expect(
			(mockCheckpoint.mock.calls[0] as [{ events: unknown[] }])[0].events,
		).toHaveLength(0);
	});

	it("falha no envio não marca sent_at — o evento vai no próximo", async () => {
		insertSession();
		insertSuiteRun();
		insertEvent("event-1", 1);

		mockCheckpoint.mockRejectedValueOnce(new Error("network down"));
		await enqueueCheckpoint("session-1", "suite-run-1", baseCheckpointInput());
		await drainOutbox("session-1");

		const [event] = mockDb
			.select()
			.from(surveyEvent)
			.where(eq(surveyEvent.id, "event-1"))
			.all();
		expect(event?.sentAt).toBeNull();

		mockCheckpoint.mockResolvedValue({
			session_id: "session-1",
			suite_code: "S1",
			chunk_index: 0,
			received_events: 1,
			suite_complete: true,
			suite_run_id: "suite-run-1",
		});
		await enqueueCheckpoint("session-1", "suite-run-1", baseCheckpointInput());
		await drainOutbox("session-1");

		const [eventAfter] = mockDb
			.select()
			.from(surveyEvent)
			.where(eq(surveyEvent.id, "event-1"))
			.all();
		expect(eventAfter?.sentAt).not.toBeNull();
	});

	it("suite_run_id divergente devolvido pelo servidor é persistido e usado no envio seguinte", async () => {
		insertSession();
		insertSuiteRun("local-run", "session-1");
		insertEvent("event-1", 1, { route: "/market" }, "local-run");

		mockCheckpoint.mockResolvedValue({
			session_id: "session-1",
			suite_code: "S1",
			chunk_index: 0,
			received_events: 1,
			suite_complete: true,
			suite_run_id: "server-run",
		});

		await enqueueCheckpoint("session-1", "local-run", baseCheckpointInput());
		await drainOutbox("session-1");

		const [suiteRun] = mockDb
			.select()
			.from(surveySuiteRun)
			.where(eq(surveySuiteRun.sessionId, "session-1"))
			.all();
		expect(suiteRun?.id).toBe("server-run");

		mockCheckpoint.mockResolvedValue({
			session_id: "session-1",
			suite_code: "S1",
			chunk_index: 0,
			received_events: 0,
			suite_complete: true,
			suite_run_id: "server-run",
		});

		await enqueueCheckpoint("session-1", "server-run", baseCheckpointInput());
		await drainOutbox("session-1");

		const input = (
			mockCheckpoint.mock.calls[1] as [{ suite_run_id: string }]
		)[0];
		expect(input.suite_run_id).toBe("server-run");
	});

	it("evento gravado entre a montagem do payload e a resposta não é marcado", async () => {
		insertSession();
		insertSuiteRun();
		insertEvent("event-1", 1);

		let resolveCheckpoint: (value: unknown) => void;
		const checkpointPromise = new Promise(resolve => {
			resolveCheckpoint = resolve;
		});
		mockCheckpoint.mockReturnValueOnce(checkpointPromise);

		const sendPromise = (async () => {
			await enqueueCheckpoint(
				"session-1",
				"suite-run-1",
				baseCheckpointInput(),
			);
			await drainOutbox("session-1");
		})();

		insertEvent("event-2", 2);
		resolveCheckpoint!({
			session_id: "session-1",
			suite_code: "S1",
			chunk_index: 0,
			received_events: 1,
			suite_complete: true,
		});
		await sendPromise;

		const events = mockDb
			.select()
			.from(surveyEvent)
			.orderBy(surveyEvent.seq)
			.all();
		expect(events[0]?.sentAt).not.toBeNull();
		expect(events[1]?.sentAt).toBeNull();
	});

	it("backoff respeita attempts — item recém-falhado não é reenviado no tick seguinte", async () => {
		insertSession();
		const staleUpdatedAt = new Date(Date.now() - 25_000).toISOString();
		mockDb
			.insert(surveyOutbox)
			.values({
				id: "failed-item",
				sessionId: "session-1",
				kind: "E2_SESSION",
				payload: {},
				status: "FAILED",
				attempts: 1,
				createdAt: staleUpdatedAt,
				updatedAt: staleUpdatedAt,
			})
			.run();

		mockUpsert.mockRejectedValueOnce(new Error("still down"));
		await drainOutbox("session-1");
		expect(mockUpsert).not.toHaveBeenCalled();

		mockDb
			.update(surveyOutbox)
			.set({ updatedAt: staleUpdatedAt })
			.where(eq(surveyOutbox.id, "failed-item"))
			.run();
	});

	it("órfão em SENDING além do limiar é recuperado e reenviado", async () => {
		insertSession();
		insertSuiteRun();
		insertEvent("event-1", 1);

		const staleUpdatedAt = new Date(Date.now() - 120_000).toISOString();
		mockDb
			.insert(surveyOutbox)
			.values({
				id: "orphan-sending",
				sessionId: "session-1",
				kind: "E3_CHECKPOINT",
				suiteCode: "S1",
				payload: {
					input: {
						session_id: "session-1",
						suite_run_id: "suite-run-1",
						chunk: { index: 0, total: 1 },
						suite: {
							code: "S1",
							position: 0,
							started_at: now,
							active_ms: 1000,
							wall_ms: 1000,
						},
						tasks: [],
						answers: [],
						events: [
							{
								client_event_id: "event-1",
								seq: 1,
								type: "screen.enter",
								occurred_at: now,
								payload: { route: "/market" },
							},
						],
					},
					eventIds: ["event-1"],
					localSuiteRunId: "suite-run-1",
				},
				status: "SENDING",
				attempts: 0,
				createdAt: staleUpdatedAt,
				updatedAt: staleUpdatedAt,
			})
			.run();

		mockCheckpoint.mockResolvedValue({
			session_id: "session-1",
			suite_code: "S1",
			chunk_index: 0,
			received_events: 1,
			suite_complete: true,
			suite_run_id: "suite-run-1",
		});

		await drainOutbox("session-1");

		expect(mockCheckpoint).toHaveBeenCalledTimes(1);
		const [row] = mockDb
			.select()
			.from(surveyOutbox)
			.where(eq(surveyOutbox.id, "orphan-sending"))
			.all();
		expect(row?.status).toBe("SENT");
	});

	it("item envenenado não impede os demais de subirem", async () => {
		insertSession();
		await enqueueSessionUpsert("session-1", sessionUpsertInput());
		await enqueueCheckpoint("session-1", undefined, baseCheckpointInput());

		mockUpsert.mockRejectedValueOnce(new Error("poison"));
		mockCheckpoint.mockResolvedValue({
			session_id: "session-1",
			suite_code: "S1",
			chunk_index: 0,
			received_events: 0,
			suite_complete: true,
		});

		await drainOutbox("session-1");

		expect(mockUpsert).toHaveBeenCalledTimes(1);
		expect(mockCheckpoint).toHaveBeenCalledTimes(1);

		const rows = mockDb
			.select()
			.from(surveyOutbox)
			.orderBy(asc(surveyOutbox.createdAt))
			.all();
		expect(rows[0]?.status).toBe("FAILED");
		expect(rows[1]?.status).toBe("SENT");
	});

	it("hasPendingSync fica falso após drenagem bem-sucedida", async () => {
		insertSession();
		await enqueueSessionUpsert("session-1", sessionUpsertInput());
		useSurveyStore.getState().setPendingSync(true);

		await drainOutbox("session-1");

		expect(useSurveyStore.getState().hasPendingSync).toBe(false);
	});

	it("hasPendingSync continua verdadeiro quando sobra item a enviar", async () => {
		insertSession();
		await enqueueSessionUpsert("session-1", sessionUpsertInput());
		mockUpsert.mockRejectedValueOnce(new Error("network down"));
		useSurveyStore.getState().setPendingSync(true);

		await drainOutbox("session-1");

		expect(useSurveyStore.getState().hasPendingSync).toBe(true);
	});
});
