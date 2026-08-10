import { act, renderHook } from "@testing-library/react-native";
import { useSurveyInviteVariant } from "@/components/survey/hooks/use-survey-invite-variant";
import { useSurveyProtocol } from "@/components/survey/hooks/use-survey-protocol";
import { useSurveyStore } from "@/stores/survey-store";

jest.mock("@/components/survey/hooks/use-survey-protocol");

const protocolFixture = {
	key: "oikos-walkthrough",
	version: 1,
	personas: [
		{ key: "COLLECTOR", label: "Coletor(a)", description: "d", suites: [] },
	],
	suites: [],
	tasks: [],
	questions: [],
};

describe("useSurveyInviteVariant", () => {
	beforeEach(() => {
		useSurveyStore.getState().reset();
		jest.mocked(useSurveyProtocol).mockReturnValue({
			data: protocolFixture,
		} as never);
	});

	it("retorna null quando a sessão está IDLE e não há protocolo", async () => {
		jest.mocked(useSurveyProtocol).mockReturnValue({ data: null } as never);

		const { result } = await renderHook(() => useSurveyInviteVariant());

		expect(result.current).toBeNull();
	});

	it("retorna invite quando a sessão está IDLE e há protocolo", async () => {
		const { result } = await renderHook(() => useSurveyInviteVariant());

		expect(result.current).toBe("invite");
	});

	it("retorna resume quando a sessão está IN_PROGRESS", async () => {
		useSurveyStore.getState().startSession("session-1", "COLLECTOR");

		const { result } = await renderHook(() => useSurveyInviteVariant());

		expect(result.current).toBe("resume");
	});

	it("retorna resume quando a sessão foi ABANDONED", async () => {
		useSurveyStore.getState().startSession("session-1", "COLLECTOR");
		useSurveyStore.getState().setStatus("ABANDONED");

		const { result } = await renderHook(() => useSurveyInviteVariant());

		expect(result.current).toBe("resume");
	});

	it("retorna completed quando a sessão está COMPLETED", async () => {
		useSurveyStore.getState().startSession("session-1", "COLLECTOR");
		useSurveyStore.getState().setStatus("COMPLETED");

		const { result } = await renderHook(() => useSurveyInviteVariant());

		expect(result.current).toBe("completed");
	});

	it("resume/completed continuam aparecendo mesmo com protocol null", async () => {
		useSurveyStore.getState().startSession("session-1", "COLLECTOR");
		jest.mocked(useSurveyProtocol).mockReturnValue({ data: null } as never);

		const { result: resumeResult } = await renderHook(() =>
			useSurveyInviteVariant(),
		);
		expect(resumeResult.current).toBe("resume");

		await act(async () => {
			useSurveyStore.getState().setStatus("COMPLETED");
		});

		const { result: completedResult } = await renderHook(() =>
			useSurveyInviteVariant(),
		);
		expect(completedResult.current).toBe("completed");
	});
});
