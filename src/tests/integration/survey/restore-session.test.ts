import { eq } from "drizzle-orm";
import {
	surveyProtocolCache,
	surveySession,
	surveySuiteRun,
	surveyTaskRun,
} from "@/libs/survey/db/schema";
import { createTestSurveyDb } from "@/libs/survey/db/test-client";

const mockDb = createTestSurveyDb();

jest.mock("@/libs/survey/db/client", () => ({
	getSurveyDb: () => mockDb,
}));

const mockProtocolQuery = jest.fn();

jest.mock("@/libs/survey/api/client", () => ({
	surveyClient: {
		usability: {
			protocol: {
				query: (...args: unknown[]) => mockProtocolQuery(...args),
			},
		},
	},
}));

jest.mock("@/stores/survey-execution-store", () => ({
	useSurveyExecutionStore: {
		getState: () => ({ setSuiteRunId: jest.fn() }),
		setState: jest.fn(),
	},
}));

import {
	restoreLatestSurveySession,
	restoreSurveySessionIfNeeded,
} from "@/libs/survey/restore-session";

const now = "2026-08-15T17:33:02.000Z";
const PROTOCOL_KEY = "oikos-walkthrough";

type SessionStatus = "IN_PROGRESS" | "COMPLETED" | "ABANDONED";

function insertSession(
	overrides: {
		status?: SessionStatus;
		protocolVersion?: number;
		id?: string;
	} = {},
) {
	mockDb
		.insert(surveySession)
		.values({
			id: overrides.id ?? "session-1",
			protocolKey: PROTOCOL_KEY,
			protocolVersion: overrides.protocolVersion ?? 9,
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
			status: overrides.status ?? "IN_PROGRESS",
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

function insertTaskRun(suiteRunId = "suite-run-1") {
	mockDb
		.insert(surveyTaskRun)
		.values({
			id: "task-run-1",
			suiteRunId,
			taskCode: "T8",
			position: 0,
			startedAt: now,
		})
		.run();
}

function buildProtocolPayload(version: number, key = PROTOCOL_KEY) {
	return {
		key,
		version,
		personas: [
			{
				key: "COLLECTOR",
				suites: [{ suite_code: "S1", specific_objectives: ["explorar"] }],
			},
		],
		suites: [
			{
				code: "S1",
				title: "Teste de Usabilidade",
				objective: "explorar o app",
				task_codes: ["T8"],
			},
		],
		tasks: [
			{
				code: "T8",
				title: "Usar os filtros de Pontos de Coleta",
				instruction: "use qualquer filtro",
			},
		],
	};
}

describe("restore de sessão do modo pesquisa — versão do protocolo", () => {
	beforeEach(() => {
		mockDb.delete(surveyTaskRun).run();
		mockDb.delete(surveySuiteRun).run();
		mockDb.delete(surveySession).run();
		mockDb.delete(surveyProtocolCache).run();
		mockProtocolQuery.mockReset();
	});

	it("restoreLatestSurveySession devolve o protocolVersion da sessão", async () => {
		insertSession({ status: "IN_PROGRESS", protocolVersion: 9 });
		mockProtocolQuery.mockResolvedValue(buildProtocolPayload(9));

		const restored = await restoreLatestSurveySession();

		expect(restored?.protocolVersion).toBe(9);
	});

	it("sessão IN_PROGRESS com versão desatualizada: apaga dados locais e retorna null", async () => {
		insertSession({ status: "IN_PROGRESS", protocolVersion: 9 });
		insertSuiteRun();
		insertTaskRun();
		mockProtocolQuery.mockResolvedValue(buildProtocolPayload(10));

		const result = await restoreSurveySessionIfNeeded();

		expect(result).toBeNull();
		expect(
			mockDb
				.select()
				.from(surveySession)
				.where(eq(surveySession.id, "session-1"))
				.all(),
		).toHaveLength(0);
		expect(mockDb.select().from(surveySuiteRun).all()).toHaveLength(0);
		expect(mockDb.select().from(surveyTaskRun).all()).toHaveLength(0);
	});

	it("sessão IN_PROGRESS com versão atual: resume normalmente (regressão)", async () => {
		insertSession({ status: "IN_PROGRESS", protocolVersion: 10 });
		mockProtocolQuery.mockResolvedValue(buildProtocolPayload(10));

		const result = await restoreSurveySessionIfNeeded();

		expect(result).not.toBeNull();
		expect(result?.sessionId).toBe("session-1");
		expect(
			mockDb
				.select()
				.from(surveySession)
				.where(eq(surveySession.id, "session-1"))
				.all(),
		).toHaveLength(1);

		const [cached] = mockDb
			.select()
			.from(surveyProtocolCache)
			.where(eq(surveyProtocolCache.protocolKey, PROTOCOL_KEY))
			.all();
		expect(cached?.protocolVersion).toBe(10);
	});

	it("sessão IN_PROGRESS offline (rede falha) cai pro cache e resume se a versão bater", async () => {
		insertSession({ status: "IN_PROGRESS", protocolVersion: 9 });
		const now2 = new Date().toISOString();
		mockDb
			.insert(surveyProtocolCache)
			.values({
				protocolKey: PROTOCOL_KEY,
				protocolVersion: 9,
				payload: buildProtocolPayload(9),
				createdAt: now2,
				updatedAt: now2,
			})
			.run();
		mockProtocolQuery.mockRejectedValue(new Error("offline"));

		const result = await restoreSurveySessionIfNeeded();

		expect(result).not.toBeNull();
		expect(
			mockDb
				.select()
				.from(surveySession)
				.where(eq(surveySession.id, "session-1"))
				.all(),
		).toHaveLength(1);
	});

	it.each([
		"COMPLETED",
		"ABANDONED",
	] as const)("sessão %s: usa cache primeiro, não dispara fetch de rede extra, e não é apagada mesmo com versão diferente no cache", async status => {
		insertSession({ status, protocolVersion: 9 });
		const now2 = new Date().toISOString();
		mockDb
			.insert(surveyProtocolCache)
			.values({
				protocolKey: PROTOCOL_KEY,
				protocolVersion: 10,
				payload: buildProtocolPayload(10),
				createdAt: now2,
				updatedAt: now2,
			})
			.run();

		const result = await restoreSurveySessionIfNeeded();

		expect(mockProtocolQuery).not.toHaveBeenCalled();
		expect(result).not.toBeNull();
		expect(result?.sessionId).toBe("session-1");
		expect(
			mockDb
				.select()
				.from(surveySession)
				.where(eq(surveySession.id, "session-1"))
				.all(),
		).toHaveLength(1);
	});
});
