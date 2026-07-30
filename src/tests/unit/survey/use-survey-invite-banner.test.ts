import { renderHook } from "@testing-library/react-native";
import { useSurveyInviteBanner } from "@/components/survey/hooks/use-survey-invite-banner";
import { useSurveyStore } from "@/stores/survey-store";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
	useRouter: () => ({ push: mockPush }),
}));

describe("useSurveyInviteBanner", () => {
	beforeEach(() => {
		useSurveyStore.getState().reset();
		mockPush.mockClear();
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

	it("retorna null quando a sessão está COMPLETED, para o banner sumir", async () => {
		useSurveyStore.getState().startSession("session-1", "COLLECTOR");
		useSurveyStore.getState().setStatus("COMPLETED");

		const { result } = await renderHook(() => useSurveyInviteBanner());

		expect(result.current).toBeNull();
	});

	it("onPress navega para /survey", async () => {
		const { result } = await renderHook(() => useSurveyInviteBanner());

		result.current?.onPress();

		expect(mockPush).toHaveBeenCalledWith("/survey");
	});
});
