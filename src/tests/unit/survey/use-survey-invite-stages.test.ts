import { renderHook } from "@testing-library/react-native";
import { useSurveyInviteStages } from "@/components/survey/hooks/use-survey-invite-stages";
import { useSurveyProtocol } from "@/components/survey/hooks/use-survey-protocol";
import { useSurveyStore } from "@/stores/survey-store";

jest.mock("@/components/survey/hooks/use-survey-protocol");

const protocolFixture = {
	key: "oikos-walkthrough",
	version: 1,
	personas: [
		{
			key: "COLLECTOR",
			label: "Coletor(a)",
			description: "d",
			suites: [
				{ suite_code: "S1", specific_objectives: [] },
				{ suite_code: "S2", specific_objectives: [] },
				{ suite_code: "S3", specific_objectives: [] },
				{ suite_code: "S4", specific_objectives: [] },
			],
		},
	],
	suites: [],
	tasks: [],
	questions: [],
};

describe("useSurveyInviteStages", () => {
	beforeEach(() => {
		useSurveyStore.getState().reset();
		jest.mocked(useSurveyProtocol).mockReturnValue({
			data: protocolFixture,
		} as never);
	});

	it("retorna array vazio quando a sessão está IDLE", async () => {
		const { result } = await renderHook(() => useSurveyInviteStages());

		expect(result.current).toEqual([]);
	});

	it("mapeia done/current/upcoming a partir do currentSuiteCode", async () => {
		useSurveyStore.getState().startSession("session-1", "COLLECTOR");
		useSurveyStore.getState().setProgress("S2", null);

		const { result } = await renderHook(() => useSurveyInviteStages());

		expect(result.current).toEqual([
			{ code: "S1", status: "done", currentLabel: "S1" },
			{ code: "S2", status: "current", currentLabel: "S2" },
			{ code: "S3", status: "upcoming", currentLabel: "S3" },
			{ code: "S4", status: "upcoming", currentLabel: "S4" },
		]);
	});

	it("retorna all-completed quando a sessão está COMPLETED", async () => {
		useSurveyStore.getState().startSession("session-1", "COLLECTOR");
		useSurveyStore.getState().setStatus("COMPLETED");

		const { result } = await renderHook(() => useSurveyInviteStages());

		expect(result.current).toEqual([
			{ code: "S1", status: "completed", currentLabel: "S1" },
			{ code: "S2", status: "completed", currentLabel: "S2" },
			{ code: "S3", status: "completed", currentLabel: "S3" },
			{ code: "S4", status: "completed", currentLabel: "S4" },
		]);
	});

	it("retorna fila vazia quando a persona não tem suítes", async () => {
		jest.mocked(useSurveyProtocol).mockReturnValue({
			data: {
				...protocolFixture,
				personas: [
					{
						key: "COLLECTOR",
						label: "Coletor(a)",
						description: "d",
						suites: [],
					},
				],
			},
		} as never);
		useSurveyStore.getState().startSession("session-1", "COLLECTOR");

		const { result } = await renderHook(() => useSurveyInviteStages());

		expect(result.current).toEqual([]);
	});

	it("retorna fila vazia quando o protocolo não foi carregado", async () => {
		jest.mocked(useSurveyProtocol).mockReturnValue({ data: null } as never);
		useSurveyStore.getState().startSession("session-1", "COLLECTOR");

		const { result } = await renderHook(() => useSurveyInviteStages());

		expect(result.current).toEqual([]);
	});
});
