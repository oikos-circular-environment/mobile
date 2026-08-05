import { render, screen, userEvent } from "@testing-library/react-native";
import SurveyClosingCommentScreen from "@/app/survey/closing-comment";
import { surveySession } from "@/libs/survey/db/schema";
import { createTestSurveyDb } from "@/libs/survey/db/test-client";
import { useSurveyStore } from "@/stores/survey-store";

const mockReplace = jest.fn();
const mockDb = createTestSurveyDb();
const mockEnqueueFinish = jest.fn().mockResolvedValue(undefined);
const mockDrainOutbox = jest.fn().mockResolvedValue(undefined);

jest.mock("expo-router", () => ({
	useRouter: () => ({ replace: mockReplace }),
}));

jest.mock("@/libs/survey/db/client", () => ({
	getSurveyDb: () => mockDb,
}));

jest.mock("@/libs/survey/queue/outbox", () => ({
	enqueueFinish: (...args: unknown[]) => mockEnqueueFinish(...args),
	drainOutbox: (...args: unknown[]) => mockDrainOutbox(...args),
}));

describe("SurveyClosingCommentScreen", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		mockReplace.mockClear();
		mockEnqueueFinish.mockClear();
		mockDrainOutbox.mockClear();
		useSurveyStore.getState().reset();
		useSurveyStore.getState().startSession("session-1", "CITIZEN");

		mockDb.delete(surveySession).run();
		const now = "2026-07-30T10:00:00.000Z";
		mockDb
			.insert(surveySession)
			.values({
				id: "session-1",
				protocolKey: "oikos-walkthrough",
				protocolVersion: 1,
				persona: "CITIZEN",
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
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("permite concluir sem escrever nada", async () => {
		const user = userEvent.setup();
		await render(<SurveyClosingCommentScreen />);

		await user.press(screen.getByText("Enviar e finalizar"));

		expect(mockEnqueueFinish).toHaveBeenCalledWith(
			"session-1",
			expect.objectContaining({ answers: [] }),
		);
		expect(useSurveyStore.getState().status).toBe("COMPLETED");
		expect(mockReplace).toHaveBeenCalledWith("/survey/thanks");
	});

	it("envia o comentário quando escrito", async () => {
		const user = userEvent.setup();
		await render(<SurveyClosingCommentScreen />);

		await user.type(
			screen.getByPlaceholderText("Escreva aqui, se quiser…"),
			"Gostei muito do app",
		);
		await user.press(screen.getByText("Enviar e finalizar"));

		expect(mockEnqueueFinish).toHaveBeenCalledWith(
			"session-1",
			expect.objectContaining({
				answers: [
					{ question_key: "free_comment", value_text: "Gostei muito do app" },
				],
			}),
		);
	});
});
