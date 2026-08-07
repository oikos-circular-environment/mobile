import { eq } from "drizzle-orm";
import { buildCheckpoint } from "@/libs/survey/build-checkpoint";
import {
	surveyAnswer,
	surveySession,
	surveySuiteRun,
	surveyTaskRun,
} from "@/libs/survey/db/schema";
import { createTestSurveyDb } from "@/libs/survey/db/test-client";

const mockDb = createTestSurveyDb();

jest.mock("@/libs/survey/db/client", () => ({
	getSurveyDb: () => mockDb,
}));

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

function insertTaskRun(
	id: string,
	taskCode: string,
	position: number,
	outcome: "YES" | "NO" | null,
	finishedAt?: string,
) {
	mockDb
		.insert(surveyTaskRun)
		.values({
			id,
			suiteRunId: "suite-run-1",
			taskCode,
			position,
			startedAt: now,
			finishedAt,
			outcome,
			autoDetected: outcome === "YES",
		})
		.run();
}

function insertAnswer(questionKey: string, valueText: string) {
	mockDb
		.insert(surveyAnswer)
		.values({
			id: `answer-${questionKey}`,
			sessionId: "session-1",
			suiteRunId: "suite-run-1",
			questionKey,
			valueText,
		})
		.run();
}

describe("buildCheckpoint", () => {
	beforeEach(() => {
		mockDb.delete(surveyAnswer).run();
		mockDb.delete(surveyTaskRun).run();
		mockDb.delete(surveySuiteRun).run();
		mockDb.delete(surveySession).run();
	});

	it("envio no meio da suíte não carrega finished_at nem outcome", async () => {
		insertSession();
		insertSuiteRun();
		insertTaskRun("task-1", "T1", 0, null);

		const payload = await buildCheckpoint("session-1", "suite-run-1", false);

		expect(payload.suite.finished_at).toBeUndefined();
		expect(payload.suite.outcome).toBeUndefined();
	});

	it("envio de fechamento carrega finished_at e outcome", async () => {
		insertSession();
		insertSuiteRun();
		mockDb
			.update(surveySuiteRun)
			.set({ outcome: "YES", finishedAt: now })
			.where(eq(surveySuiteRun.id, "suite-run-1"))
			.run();
		insertTaskRun("task-1", "T1", 0, "YES", now);

		const payload = await buildCheckpoint("session-1", "suite-run-1", true);

		expect(payload.suite.finished_at).toBeDefined();
		expect(payload.suite.outcome).toBe("YES");
	});

	it("payload é cumulativo: contém todas as tarefas resolvidas até o momento", async () => {
		insertSession();
		insertSuiteRun();
		insertTaskRun("run-1", "T1", 0, "YES", now);
		insertTaskRun("run-2", "T2", 1, null);
		insertTaskRun("run-3", "T3", 2, "NO", now);
		insertAnswer("satisfaction", "bom");

		const payload = await buildCheckpoint("session-1", "suite-run-1", false);

		expect(payload.tasks).toHaveLength(3);
		expect(payload.tasks.map(t => t.code)).toEqual(["T1", "T2", "T3"]);
		expect(payload.tasks.find(t => t.code === "T1")?.outcome).toBe("YES");
		expect(payload.tasks.find(t => t.code === "T2")?.outcome).toBeUndefined();
		expect(payload.answers).toHaveLength(1);
		expect(payload.answers[0]?.question_key).toBe("satisfaction");
	});
});
