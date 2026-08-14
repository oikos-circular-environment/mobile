import { renderHook } from "@testing-library/react-native";
import { useSurveyPersonaLabel } from "@/components/survey/hooks/use-survey-persona-label";
import { useSurveyProtocol } from "@/components/survey/hooks/use-survey-protocol";
import { useSurveyStore } from "@/stores/survey-store";

jest.mock("@/components/survey/hooks/use-survey-protocol");

const protocolFixture = {
	key: "oikos-walkthrough",
	version: 1,
	personas: [
		{ key: "COLLECTOR", label: "Coletor(a)", description: "d", suites: [] },
		{ key: "CITIZEN", label: "Cidadão", description: "d", suites: [] },
	],
	suites: [],
	tasks: [],
	questions: [],
};

describe("useSurveyPersonaLabel", () => {
	beforeEach(() => {
		useSurveyStore.getState().reset();
		jest.mocked(useSurveyProtocol).mockReturnValue({
			data: protocolFixture,
		} as never);
	});

	it("retorna a label da persona ativa", async () => {
		useSurveyStore.getState().startSession("session-1", "COLLECTOR");

		const { result } = await renderHook(() => useSurveyPersonaLabel());

		expect(result.current).toBe("Coletor(a)");
	});

	it("retorna undefined quando não há sessão", async () => {
		const { result } = await renderHook(() => useSurveyPersonaLabel());

		expect(result.current).toBeUndefined();
	});

	it("retorna undefined quando a persona não existe no protocolo", async () => {
		useSurveyStore.getState().startSession("session-1", "UNKNOWN");

		const { result } = await renderHook(() => useSurveyPersonaLabel());

		expect(result.current).toBeUndefined();
	});

	it("retorna undefined quando o protocolo não foi carregado", async () => {
		useSurveyStore.getState().startSession("session-1", "COLLECTOR");
		jest.mocked(useSurveyProtocol).mockReturnValue({ data: null } as never);

		const { result } = await renderHook(() => useSurveyPersonaLabel());

		expect(result.current).toBeUndefined();
	});
});
