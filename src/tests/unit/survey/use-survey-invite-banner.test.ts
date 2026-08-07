import { renderHook } from "@testing-library/react-native";
import { useSurveyInviteBanner } from "@/components/survey/hooks/use-survey-invite-banner";
import { useSurveyParticipantCode } from "@/components/survey/hooks/use-survey-participant-code";
import { useSurveyProtocol } from "@/components/survey/hooks/use-survey-protocol";
import { useSurveyStore } from "@/stores/survey-store";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
	useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/components/survey/hooks/use-survey-protocol");
jest.mock("@/components/survey/hooks/use-survey-participant-code");

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

describe("useSurveyInviteBanner", () => {
	beforeEach(() => {
		useSurveyStore.getState().reset();
		mockPush.mockClear();
		jest.mocked(useSurveyProtocol).mockReturnValue({
			data: protocolFixture,
		} as never);
		jest.mocked(useSurveyParticipantCode).mockReturnValue(null);
	});

	it("retorna variant invite quando a sessão está IDLE", async () => {
		const { result } = await renderHook(() => useSurveyInviteBanner());

		expect(result.current).toMatchObject({ variant: "invite" });
	});

	it("retorna variant resume quando a sessão está IN_PROGRESS", async () => {
		useSurveyStore.getState().startSession("session-1", "COLLECTOR");

		const { result } = await renderHook(() => useSurveyInviteBanner());

		expect(result.current).toMatchObject({ variant: "resume" });
	});

	it("retorna variant resume quando a sessão foi ABANDONED", async () => {
		useSurveyStore.getState().startSession("session-1", "COLLECTOR");
		useSurveyStore.getState().setStatus("ABANDONED");

		const { result } = await renderHook(() => useSurveyInviteBanner());

		expect(result.current).toMatchObject({ variant: "resume" });
	});

	it("retorna variant completed quando a sessão está COMPLETED", async () => {
		useSurveyStore.getState().startSession("session-1", "COLLECTOR");
		useSurveyStore.getState().setStatus("COMPLETED");

		const { result } = await renderHook(() => useSurveyInviteBanner());

		expect(result.current).toMatchObject({
			variant: "completed",
			title: "Pesquisa finalizada",
		});
	});

	it("onPress navega para /survey quando é convite", async () => {
		const { result } = await renderHook(() => useSurveyInviteBanner());

		result.current?.onPress();

		expect(mockPush).toHaveBeenCalledWith("/survey");
	});

	it("onPress navega para /survey/resume quando é retomada", async () => {
		useSurveyStore.getState().startSession("session-1", "COLLECTOR");

		const { result } = await renderHook(() => useSurveyInviteBanner());
		result.current?.onPress();

		expect(mockPush).toHaveBeenCalledWith("/survey/resume");
	});

	it("na retomada, traz persona, código e etapas — igual ao CP49r", async () => {
		useSurveyStore.getState().startSession("session-1", "COLLECTOR");
		useSurveyStore.getState().setProgress("S2", null);
		jest.mocked(useSurveyParticipantCode).mockReturnValue("PSQ-7X29-QK41");

		const { result } = await renderHook(() => useSurveyInviteBanner());

		expect(result.current).toMatchObject({
			personaLabel: "Coletor(a)",
			participantCode: "PSQ-7X29-QK41",
			description: "Você está na Etapa 2 de 4.",
		});
		expect(result.current?.stages).toEqual([
			{ code: "S1", status: "done", currentLabel: "S1" },
			{ code: "S2", status: "current", currentLabel: "S2" },
			{ code: "S3", status: "upcoming", currentLabel: "S3" },
			{ code: "S4", status: "upcoming", currentLabel: "S4" },
		]);

		result.current?.onPress?.();
		expect(mockPush).toHaveBeenCalledWith("/survey/resume");
	});

	it("sem código sincronizado ainda, o card não quebra — participantCode fica undefined", async () => {
		useSurveyStore.getState().startSession("session-1", "COLLECTOR");
		jest.mocked(useSurveyParticipantCode).mockReturnValue(null);

		const { result } = await renderHook(() => useSurveyInviteBanner());

		expect(result.current?.participantCode).toBeUndefined();
	});

	it("retorna null quando o servidor não tem versão ativa do protocolo (IDLE)", async () => {
		jest.mocked(useSurveyProtocol).mockReturnValue({ data: null } as never);

		const { result } = await renderHook(() => useSurveyInviteBanner());

		expect(result.current).toBeNull();
	});

	it("retomada continua aparecendo mesmo com protocol null/erro", async () => {
		useSurveyStore.getState().startSession("session-1", "COLLECTOR");
		jest.mocked(useSurveyProtocol).mockReturnValue({ data: null } as never);

		const { result } = await renderHook(() => useSurveyInviteBanner());

		expect(result.current).toMatchObject({ variant: "resume" });
	});
});
