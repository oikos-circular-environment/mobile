import { useSurveyStore } from "@/stores/survey-store";

describe("survey-store", () => {
	beforeEach(() => {
		useSurveyStore.getState().reset();
	});

	it("inicia uma sessão em IN_PROGRESS", () => {
		useSurveyStore.getState().startSession("session-1", "COLLECTOR");

		expect(useSurveyStore.getState()).toMatchObject({
			sessionId: "session-1",
			status: "IN_PROGRESS",
			activeMs: 0,
		});
	});

	it("acumula activeMs e wallMs em vez de sobrescrever", () => {
		useSurveyStore.getState().addActiveMs(1000);
		useSurveyStore.getState().addActiveMs(500);

		expect(useSurveyStore.getState().activeMs).toBe(1500);
	});

	it("reset volta ao estado inicial", () => {
		useSurveyStore.getState().startSession("session-1", "COLLECTOR");
		useSurveyStore.getState().setParticipantCode("PSQ-ABCD-EFGH");

		useSurveyStore.getState().reset();

		expect(useSurveyStore.getState().sessionId).toBeNull();
		expect(useSurveyStore.getState().participantCode).toBeNull();
	});
});
