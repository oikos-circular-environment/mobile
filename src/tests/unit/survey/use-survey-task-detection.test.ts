import { renderHook } from "@testing-library/react-native";
import { createTestSurveyDb } from "@/libs/survey/db/test-client";

const mockDb = createTestSurveyDb();

jest.mock("@/libs/survey/db/client", () => ({
	getSurveyDb: () => mockDb,
}));

jest.mock("expo-router", () => ({
	usePathname: () => "/",
}));

jest.mock("@/components/survey/hooks/use-survey-protocol");

import { useSurveyProtocol } from "@/components/survey/hooks/use-survey-protocol";
import { useSurveyTaskDetection } from "@/components/survey/hooks/use-survey-task-detection";
import { networkTelemetryBus } from "@/libs/network-telemetry-bus";
import { surveyTaskRun } from "@/libs/survey/db/schema";
import { useSurveyExecutionStore } from "@/stores/survey-execution-store";

const protocolFixture = {
	key: "oikos-walkthrough",
	version: 1,
	personas: [],
	suites: [],
	tasks: [
		{
			code: "T1",
			title: "Criar uma conta",
			instruction: "Crie uma conta.",
			success: {
				mode: "any",
				signals: [
					{
						kind: "api",
						method: "POST",
						path_pattern: "/v1/users/register",
						status: 204,
					},
				],
			},
		},
	],
	questions: [],
};

describe("useSurveyTaskDetection", () => {
	beforeEach(() => {
		useSurveyExecutionStore.getState().reset();
		mockDb.delete(surveyTaskRun).run();
		jest.mocked(useSurveyProtocol).mockReturnValue({
			data: protocolFixture,
		} as never);
	});

	it("avança a tarefa automaticamente quando o sinal de rede casa, sem diálogo de confirmação", async () => {
		useSurveyExecutionStore.getState().openSuiteIntro({
			code: "S2",
			title: "S2",
			objective: "obj",
			tasks: [{ code: "T1", title: "Criar uma conta", instruction: "x" }],
		});
		useSurveyExecutionStore.getState().setSuiteRunId("suite-run-1");
		useSurveyExecutionStore.getState().beginSuite();

		await renderHook(() => useSurveyTaskDetection());

		networkTelemetryBus.emit({
			method: "POST",
			path: "/v1/users/register",
			status: 204,
		});

		await new Promise(resolve => setTimeout(resolve, 0));

		expect(useSurveyExecutionStore.getState().tasks[0]?.status).toBe("done");
	});

	it("uma tarefa sem sinal detectado não avança", async () => {
		useSurveyExecutionStore.getState().openSuiteIntro({
			code: "S2",
			title: "S2",
			objective: "obj",
			tasks: [{ code: "T1", title: "Criar uma conta", instruction: "x" }],
		});
		useSurveyExecutionStore.getState().setSuiteRunId("suite-run-1");
		useSurveyExecutionStore.getState().beginSuite();

		await renderHook(() => useSurveyTaskDetection());

		networkTelemetryBus.emit({
			method: "GET",
			path: "/v1/market/companies",
			status: 200,
		});

		await new Promise(resolve => setTimeout(resolve, 0));

		expect(useSurveyExecutionStore.getState().tasks[0]?.status).toBe("current");
	});
});
