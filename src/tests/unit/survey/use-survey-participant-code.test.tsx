import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { useSurveyParticipantCode } from "@/components/survey/hooks/use-survey-participant-code";
import { surveySession } from "@/libs/survey/db/schema";
import { createTestSurveyDb } from "@/libs/survey/db/test-client";

const mockDb = createTestSurveyDb();

jest.mock("@/libs/survey/db/client", () => ({
	getSurveyDb: () => mockDb,
}));

const now = "2026-07-30T10:00:00.000Z";

function insertSession(id: string, participantCode: string | null) {
	mockDb
		.insert(surveySession)
		.values({
			id,
			protocolKey: "oikos-walkthrough",
			protocolVersion: 1,
			persona: "COLLECTOR",
			participantCode,
			stateUf: "SP",
			cityName: "São Paulo",
			ageRange: "AGE_18_24",
			educationLevel: "HIGHSCHOOL_COMPLETE",
			chainRole: "NONE",
			wasteContactFrequency: 3,
			appExperience: 3,
			consentVersion: "2026-07-30",
			consentAt: now,
			deviceOs: "ios",
			deviceOsVersion: "18",
			appVersion: "1.0.0",
			screenSize: "MEDIUM",
			startedAt: now,
			createdAt: now,
			updatedAt: now,
		})
		.run();
}

function wrapper({ children }: { children: ReactNode }) {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}

describe("useSurveyParticipantCode", () => {
	beforeEach(() => {
		mockDb.delete(surveySession).run();
	});

	it("retorna null sem sessão", async () => {
		const { result } = await renderHook(() => useSurveyParticipantCode(null), {
			wrapper,
		});

		expect(result.current).toBeNull();
	});

	it("retorna o código já sincronizado", async () => {
		insertSession("session-1", "PSQ-7X29-QK41");

		const { result } = await renderHook(
			() => useSurveyParticipantCode("session-1"),
			{ wrapper },
		);

		await waitFor(() => expect(result.current).toBe("PSQ-7X29-QK41"));
	});

	it("retorna null enquanto o código ainda não chegou", async () => {
		insertSession("session-2", null);

		const { result } = await renderHook(
			() => useSurveyParticipantCode("session-2"),
			{ wrapper },
		);

		await waitFor(() => expect(result.current).toBeNull());
	});
});
