import { render, screen, userEvent } from "@testing-library/react-native";
import SurveyThanksScreen from "@/app/survey/thanks";
import { surveySession } from "@/libs/survey/db/schema";
import { createTestSurveyDb } from "@/libs/survey/db/test-client";
import { useSurveyStore } from "@/stores/survey-store";

const mockDismissTo = jest.fn();
const mockDb = createTestSurveyDb();

jest.mock("expo-router", () => ({
	useRouter: () => ({ dismissTo: mockDismissTo }),
}));

jest.mock("@/libs/survey/db/client", () => ({
	getSurveyDb: () => mockDb,
}));

const now = "2026-07-30T10:00:00.000Z";

function insertSession(participantCode: string | null) {
	mockDb
		.insert(surveySession)
		.values({
			id: "session-1",
			protocolKey: "oikos-walkthrough",
			protocolVersion: 1,
			persona: "CITIZEN",
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

describe("SurveyThanksScreen", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		mockDismissTo.mockClear();
		mockDb.delete(surveySession).run();
		useSurveyStore.getState().reset();
		useSurveyStore.getState().startSession("session-1", "CITIZEN");
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("mostra o código do participante quando já sincronizado", async () => {
		insertSession("PSQ-7X29-QK41");
		await render(<SurveyThanksScreen />);

		expect(await screen.findByText("PSQ-7X29-QK41")).toBeOnTheScreen();
	});

	it("explica que o código aparece depois quando ainda não sincronizou", async () => {
		insertSession(null);
		await render(<SurveyThanksScreen />);

		expect(
			await screen.findByText(
				"Seu código aparece aqui assim que houver conexão.",
			),
		).toBeOnTheScreen();
	});

	it("voltar para minha conta encerra o estado local e fecha para a home", async () => {
		insertSession("PSQ-7X29-QK41");
		const user = userEvent.setup();
		await render(<SurveyThanksScreen />);

		await user.press(screen.getByText("Voltar para minha conta"));

		expect(mockDismissTo).toHaveBeenCalledWith("/(tabs)/(home)");
	});
});
