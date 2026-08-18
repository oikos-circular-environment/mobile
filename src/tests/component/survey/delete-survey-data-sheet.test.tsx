import { act, render, screen, userEvent } from "@testing-library/react-native";
import { TRPCClientError } from "@trpc/client";
import { createRef } from "react";
import {
	DeleteSurveyDataSheet,
	type DeleteSurveyDataSheetHandle,
} from "@/components/survey/delete-survey-data-sheet";
import { surveySession } from "@/libs/survey/db/schema";
import { createTestSurveyDb } from "@/libs/survey/db/test-client";
import { useSurveyDraftStore } from "@/stores/survey-draft-store";
import { useSurveyExecutionStore } from "@/stores/survey-execution-store";
import { useSurveyStore } from "@/stores/survey-store";

const mockDismissTo = jest.fn();
const mockDeleteMutate = jest.fn();
const mockToastError = jest.fn();
const mockDb = createTestSurveyDb();

jest.mock("expo-router", () => ({
	useRouter: () => ({ dismissTo: mockDismissTo }),
}));

jest.mock("@/libs/survey/db/client", () => ({
	getSurveyDb: () => mockDb,
}));

jest.mock("@/libs/survey/api/client", () => ({
	surveyClient: {
		usability: {
			session: {
				delete: { mutate: (...args: unknown[]) => mockDeleteMutate(...args) },
			},
		},
	},
}));

jest.mock("@/components/toast", () => ({
	toast: { error: (...args: unknown[]) => mockToastError(...args) },
}));

const now = "2026-08-18T10:00:00.000Z";

function insertSession() {
	mockDb
		.insert(surveySession)
		.values({
			id: "session-1",
			protocolKey: "oikos-walkthrough",
			protocolVersion: 1,
			persona: "CITIZEN",
			participantCode: "01M0B68HECSH7KXHTHRJX1QR72",
			stateUf: "SP",
			cityName: "São Paulo",
			ageRange: "AGE_18_24",
			educationLevel: "HIGHSCHOOL_COMPLETE",
			chainRole: "NONE",
			wasteContactFrequency: 3,
			appExperience: 3,
			consentVersion: "2026-08-18",
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

describe("DeleteSurveyDataSheet", () => {
	const sheetRef = createRef<DeleteSurveyDataSheetHandle>();

	beforeEach(() => {
		jest.useFakeTimers();
		jest.clearAllMocks();
		mockDb.delete(surveySession).run();
		insertSession();
		useSurveyStore.getState().reset();
		useSurveyStore.getState().startSession("session-1", "CITIZEN");
		useSurveyExecutionStore.getState().reset();
		useSurveyDraftStore.getState().reset();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	async function renderSheet() {
		return await render(
			<DeleteSurveyDataSheet
				ref={sheetRef}
				participantCode="01M0B68HECSH7KXHTHRJX1QR72"
			/>,
		);
	}

	async function openAndConfirm() {
		await act(async () => sheetRef.current?.open());
		await userEvent.press(screen.getByText("Excluir meus dados"));
	}

	it("apaga no servidor e localmente, depois navega para home", async () => {
		mockDeleteMutate.mockResolvedValueOnce({
			participant_code: "01M0B68HECSH7KXHTHRJX1QR72",
			deleted: true,
		});
		await renderSheet();

		await openAndConfirm();

		expect(mockDeleteMutate).toHaveBeenCalledWith({ session_id: "session-1" });
		const remaining = mockDb.select().from(surveySession).all();
		expect(remaining).toHaveLength(0);
		expect(useSurveyStore.getState().sessionId).toBeNull();
		expect(mockDismissTo).toHaveBeenCalledWith("/(tabs)/(home)");
	});

	it("trata NOT_FOUND do servidor como já excluído e ainda assim apaga local", async () => {
		mockDeleteMutate.mockRejectedValueOnce(
			new TRPCClientError("not found", {
				result: {
					error: {
						code: "NOT_FOUND",
						message: "not found",
						data: { code: "NOT_FOUND" },
					},
				},
			}),
		);
		await renderSheet();

		await openAndConfirm();

		const remaining = mockDb.select().from(surveySession).all();
		expect(remaining).toHaveLength(0);
		expect(mockDismissTo).toHaveBeenCalled();
		expect(mockToastError).not.toHaveBeenCalled();
	});

	it("mantém dados locais e avisa por toast quando o servidor falha por outro motivo", async () => {
		mockDeleteMutate.mockRejectedValueOnce(new Error("network down"));
		await renderSheet();

		await openAndConfirm();

		const remaining = mockDb.select().from(surveySession).all();
		expect(remaining).toHaveLength(1);
		expect(useSurveyStore.getState().sessionId).toBe("session-1");
		expect(mockDismissTo).not.toHaveBeenCalled();
		expect(mockToastError).toHaveBeenCalled();
	});
});
