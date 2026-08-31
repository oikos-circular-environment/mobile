import { act, renderHook, waitFor } from "@testing-library/react-native";
import { eq } from "drizzle-orm";
import { surveySession } from "@/libs/survey/db/schema";
import { createTestSurveyDb } from "@/libs/survey/db/test-client";

const mockDb = createTestSurveyDb();

jest.mock("@/libs/survey/db/client", () => ({
	getSurveyDb: () => mockDb,
}));

import { useSurveyTourSeen } from "@/components/survey/hooks/use-survey-tour-seen";

const now = "2026-08-15T17:33:02.000Z";

function insertSession(id: string) {
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

describe("useSurveyTourSeen", () => {
	beforeEach(() => {
		mockDb.delete(surveySession).run();
	});

	it("resolve loaded=true e seen=false quando a sessão não tem tourSeenAt", async () => {
		insertSession("session-1");

		const { result } = await renderHook(() => useSurveyTourSeen("session-1"));

		await waitFor(() => expect(result.current.loaded).toBe(true));

		expect(result.current.seen).toBe(false);
	});

	it("resolve seen=true quando a sessão já tem tourSeenAt gravado", async () => {
		insertSession("session-1");
		mockDb
			.update(surveySession)
			.set({ tourSeenAt: now })
			.where(eq(surveySession.id, "session-1"))
			.run();

		const { result } = await renderHook(() => useSurveyTourSeen("session-1"));

		await waitFor(() => expect(result.current.loaded).toBe(true));

		expect(result.current.seen).toBe(true);
	});

	it("markSeen marca seen=true otimisticamente e persiste tourSeenAt na sessão", async () => {
		insertSession("session-1");

		const { result } = await renderHook(() => useSurveyTourSeen("session-1"));

		await waitFor(() => expect(result.current.loaded).toBe(true));

		await act(() => {
			result.current.markSeen();
		});

		expect(result.current.seen).toBe(true);

		await waitFor(() => {
			const [row] = mockDb
				.select({ tourSeenAt: surveySession.tourSeenAt })
				.from(surveySession)
				.where(eq(surveySession.id, "session-1"))
				.all();
			expect(row?.tourSeenAt).toBeTruthy();
		});
	});

	it("trata sessionId ausente como não visto, sem quebrar", async () => {
		const { result } = await renderHook(() => useSurveyTourSeen(null));

		await waitFor(() => expect(result.current.loaded).toBe(true));

		expect(result.current.seen).toBe(false);
	});

	it("sessões diferentes têm o tour visto de forma independente", async () => {
		insertSession("session-1");
		insertSession("session-2");
		mockDb
			.update(surveySession)
			.set({ tourSeenAt: now })
			.where(eq(surveySession.id, "session-1"))
			.run();

		const { result } = await renderHook(() => useSurveyTourSeen("session-2"));

		await waitFor(() => expect(result.current.loaded).toBe(true));

		expect(result.current.seen).toBe(false);
	});
});
