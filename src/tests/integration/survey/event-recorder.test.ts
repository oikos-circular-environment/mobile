import { networkTelemetryBus } from "@/libs/network-telemetry-bus";
import {
	surveyEvent,
	surveySession,
	surveySuiteRun,
} from "@/libs/survey/db/schema";
import { createTestSurveyDb } from "@/libs/survey/db/test-client";
import { screenRouteBus } from "@/libs/survey/screen-route-bus";
import { uiEventBus } from "@/libs/ui-event-bus";
import { useSurveyExecutionStore } from "@/stores/survey-execution-store";

const mockDb = createTestSurveyDb();

jest.mock("@/libs/survey/db/client", () => ({
	getSurveyDb: () => mockDb,
}));

import { start, stop } from "@/libs/survey/event-recorder";

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

function activateSuite() {
	useSurveyExecutionStore.setState({
		isActive: true,
		currentTaskIndex: 0,
		tasks: [
			{
				code: "T1",
				title: "Tarefa 1",
				instruction: "",
				status: "current",
				position: 0,
			},
		],
	});
}

function deactivateSuite() {
	useSurveyExecutionStore.setState({ isActive: false, tasks: [] });
}

function flushAsync() {
	return new Promise(resolve => setTimeout(resolve, 20));
}

describe("gravador de eventos do modo pesquisa", () => {
	beforeEach(() => {
		stop();
		mockDb.delete(surveyEvent).run();
		mockDb.delete(surveySuiteRun).run();
		mockDb.delete(surveySession).run();
		deactivateSuite();
	});

	it("grava evento de rede com os campos corretos enquanto a suíte está ativa", async () => {
		insertSession();
		insertSuiteRun();
		activateSuite();
		start("session-1", "suite-run-1");

		networkTelemetryBus.emit({
			method: "GET",
			path: "/v1/market",
			status: 200,
			query: { q: "plastico" },
		});
		await flushAsync();

		const rows = mockDb.select().from(surveyEvent).all();
		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({
			sessionId: "session-1",
			suiteRunId: "suite-run-1",
			seq: 1,
			type: "api.call",
			taskCode: "T1",
			payload: {
				method: "GET",
				path: "/v1/market",
				status: 200,
				query: { q: "plastico" },
			},
		});
	});

	it("não grava nada fora de suíte ativa", async () => {
		insertSession();
		insertSuiteRun();
		deactivateSuite();
		start("session-1", "suite-run-1");

		networkTelemetryBus.emit({
			method: "GET",
			path: "/v1/market",
			status: 200,
		});
		await flushAsync();

		expect(mockDb.select().from(surveyEvent).all()).toHaveLength(0);
	});

	it("seq é monotônico, inclusive após simular reinício", async () => {
		insertSession();
		insertSuiteRun();
		activateSuite();
		start("session-1", "suite-run-1");

		networkTelemetryBus.emit({ method: "GET", path: "/a", status: 200 });
		networkTelemetryBus.emit({ method: "GET", path: "/b", status: 200 });
		await flushAsync();

		stop();
		start("session-1", "suite-run-1");

		uiEventBus.emit({ name: "complaint.opened", payload: { source: "map" } });
		await flushAsync();

		const rows = mockDb
			.select()
			.from(surveyEvent)
			.orderBy(surveyEvent.seq)
			.all();
		expect(rows.map(r => r.seq)).toEqual([1, 2, 3]);
	});

	it("dispose remove as assinaturas", async () => {
		insertSession();
		insertSuiteRun();
		activateSuite();
		start("session-1", "suite-run-1");
		stop();

		networkTelemetryBus.emit({
			method: "GET",
			path: "/v1/market",
			status: 200,
		});
		uiEventBus.emit({ name: "complaint.opened" });
		screenRouteBus.emit({ route: "/market" });
		await flushAsync();

		expect(mockDb.select().from(surveyEvent).all()).toHaveLength(0);
	});
});
