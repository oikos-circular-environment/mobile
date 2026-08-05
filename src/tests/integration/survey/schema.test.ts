import { eq } from "drizzle-orm";
import {
	surveyAnswer,
	surveyEvent,
	surveySession,
	surveySuiteRun,
	surveyTaskRun,
} from "@/libs/survey/db/schema";
import { createTestSurveyDb } from "@/libs/survey/db/test-client";

const now = "2026-08-15T17:33:02.000Z";

function insertSession(
	db: ReturnType<typeof createTestSurveyDb>,
	id = "session-1",
) {
	db.insert(surveySession)
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

describe("schema do modo pesquisa — migração e CRUD", () => {
	it("roda a migração limpa e cria as cinco tabelas", () => {
		expect(() => createTestSurveyDb()).not.toThrow();
	});

	it("grava e lê uma sessão", () => {
		const db = createTestSurveyDb();
		insertSession(db);

		const [row] = db
			.select()
			.from(surveySession)
			.where(eq(surveySession.id, "session-1"))
			.all();

		expect(row).toMatchObject({
			id: "session-1",
			persona: "COLLECTOR",
			status: "IN_PROGRESS",
			participantCode: null,
		});
	});

	it("grava execução de suíte e de tarefa, ligadas à sessão", () => {
		const db = createTestSurveyDb();
		insertSession(db);

		db.insert(surveySuiteRun)
			.values({
				id: "suite-run-1",
				sessionId: "session-1",
				suiteCode: "S1",
				position: 1,
				startedAt: now,
			})
			.run();

		db.insert(surveyTaskRun)
			.values({
				id: "task-run-1",
				suiteRunId: "suite-run-1",
				taskCode: "T8",
				position: 1,
				startedAt: now,
			})
			.run();

		const [taskRun] = db
			.select()
			.from(surveyTaskRun)
			.where(eq(surveyTaskRun.id, "task-run-1"))
			.all();

		expect(taskRun).toMatchObject({
			suiteRunId: "suite-run-1",
			taskCode: "T8",
		});
	});

	it("respeita a unicidade de (session, suite) em survey_suite_run", () => {
		const db = createTestSurveyDb();
		insertSession(db);

		db.insert(surveySuiteRun)
			.values({
				id: "suite-run-1",
				sessionId: "session-1",
				suiteCode: "S1",
				position: 1,
				startedAt: now,
			})
			.run();

		expect(() =>
			db
				.insert(surveySuiteRun)
				.values({
					id: "suite-run-2",
					sessionId: "session-1",
					suiteCode: "S1",
					position: 1,
					startedAt: now,
				})
				.run(),
		).toThrow();
	});

	it("grava evento e resposta, e a exclusão da sessão apaga tudo em cascata", () => {
		const db = createTestSurveyDb();
		insertSession(db);

		db.insert(surveyEvent)
			.values({
				id: "event-1",
				sessionId: "session-1",
				seq: 1,
				type: "screen.enter",
				occurredAt: now,
				payload: { route: "/market" },
			})
			.run();

		db.insert(surveyAnswer)
			.values({
				id: "answer-1",
				sessionId: "session-1",
				questionKey: "satisfaction",
				valueNumber: 4,
			})
			.run();

		db.delete(surveySession).where(eq(surveySession.id, "session-1")).run();

		expect(db.select().from(surveyEvent).all()).toHaveLength(0);
		expect(db.select().from(surveyAnswer).all()).toHaveLength(0);
	});
});
