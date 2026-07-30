import { surveySession } from "@/libs/survey/db/schema";
import { createTestSurveyDb } from "@/libs/survey/db/test-client";

const mockDb = createTestSurveyDb();

jest.mock("@/libs/survey/db/client", () => ({
	getSurveyDb: () => mockDb,
}));

const mockUpsert = jest.fn().mockResolvedValue({
	session_id: "session-1",
	participant_code: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
	protocol_version: 1,
});
const mockCheckpoint = jest.fn().mockResolvedValue({
	session_id: "session-1",
	suite_code: "S1",
	chunk_index: 0,
	received_events: 1,
	suite_complete: true,
});

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

import { surveyOutbox } from "@/libs/survey/db/schema";
import {
	drainOutbox,
	enqueueCheckpoint,
	enqueueSessionUpsert,
} from "@/libs/survey/queue/outbox";

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

describe("fila de envio do modo pesquisa", () => {
	beforeEach(() => {
		mockDb.delete(surveyOutbox).run();
		mockDb.delete(surveySession).run();
		mockUpsert.mockClear();
		mockCheckpoint.mockClear();
	});

	it("fatia os eventos do checkpoint quando o payload passa do teto", async () => {
		insertSession();
		const events = Array.from({ length: 3000 }, (_, index) => ({
			client_event_id: `event-${index}`,
			seq: index,
			type: "screen.enter",
			occurred_at: now,
			payload: { route: "/market" },
		}));

		await enqueueCheckpoint("session-1", {
			session_id: "session-1",
			chunk: { index: 0, total: 1 },
			suite: {
				code: "S1",
				position: 1,
				started_at: now,
				active_ms: 1000,
				wall_ms: 1000,
			},
			events,
		});

		const rows = mockDb.select().from(surveyOutbox).all();
		expect(rows.length).toBeGreaterThan(1);
		expect(rows[0]?.chunkTotal).toBe(rows.length);
	});

	it("drainOutbox sempre envia E2_SESSION pendente antes de qualquer outro item, mesmo enfileirado depois", async () => {
		insertSession();
		await enqueueCheckpoint("session-1", {
			session_id: "session-1",
			chunk: { index: 0, total: 1 },
			suite: {
				code: "S1",
				position: 1,
				started_at: now,
				active_ms: 1000,
				wall_ms: 1000,
			},
			events: [],
		});
		await enqueueSessionUpsert("session-1", {
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
		});

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
		await enqueueSessionUpsert("session-1", {
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
		});

		await drainOutbox("session-1");
		expect(mockUpsert).toHaveBeenCalledTimes(1);

		await drainOutbox("session-1");
		expect(mockUpsert).toHaveBeenCalledTimes(1);
	});

	it("marca o item como FAILED e para de drenar quando o envio falha", async () => {
		insertSession();
		await enqueueSessionUpsert("session-1", {
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
		});

		mockUpsert.mockRejectedValueOnce(new Error("network down"));
		await drainOutbox("session-1");

		const [row] = mockDb.select().from(surveyOutbox).all();
		expect(row?.status).toBe("FAILED");
		expect(row?.attempts).toBe(1);
	});
});
