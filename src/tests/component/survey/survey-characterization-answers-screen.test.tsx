import { render, screen } from "@testing-library/react-native";
import SurveyCharacterizationAnswersScreen from "@/app/survey/characterization-answers";
import { useSurveyProtocol } from "@/components/survey/hooks/use-survey-protocol";
import { surveySession } from "@/libs/survey/db/schema";
import { createTestSurveyDb } from "@/libs/survey/db/test-client";
import { useSurveyStore } from "@/stores/survey-store";

const mockBack = jest.fn();
const mockDb = createTestSurveyDb();

jest.mock("expo-router", () => ({
	useRouter: () => ({ back: mockBack }),
}));

jest.mock("@/libs/survey/db/client", () => ({
	getSurveyDb: () => mockDb,
}));

jest.mock("@/components/survey/hooks/use-survey-protocol");

const protocolFixture = {
	key: "oikos-walkthrough",
	version: 1,
	personas: [{ key: "CITIZEN", label: "Cidadão", description: "d" }],
	suites: [],
	tasks: [],
	questions: [
		{
			key: "city",
			scope: "SCREENER",
			type: "SELECT",
			position: 1,
			label: "Cidade",
			options: [],
		},
		{
			key: "age_range",
			scope: "SCREENER",
			type: "SELECT",
			position: 2,
			label: "Qual sua faixa etária?",
			options: [{ key: "AGE_18_24", value: null, label: "18 a 24 anos" }],
		},
		{
			key: "waste_contact_frequency",
			scope: "SCREENER",
			type: "SCALE",
			position: 3,
			label: "Com que frequência você lida com resíduos?",
			options: [
				{ value: 3, key: "SOMETIMES", label: "Às vezes" },
				{ value: 4, key: "OFTEN", label: "Frequentemente" },
			],
		},
	],
};

describe("SurveyCharacterizationAnswersScreen", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		mockBack.mockClear();
		mockDb.delete(surveySession).run();
		useSurveyStore.getState().reset();
		useSurveyStore.getState().startSession("session-1", "CITIZEN");
		jest.mocked(useSurveyProtocol).mockReturnValue({
			data: protocolFixture,
		} as never);

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

	it("mostra a persona e as respostas do rastreio, sem permitir edição", async () => {
		await render(<SurveyCharacterizationAnswersScreen />);

		expect(await screen.findByText("Cidadão")).toBeOnTheScreen();
		expect(screen.getByText("São Paulo")).toBeOnTheScreen();
		expect(screen.getByText("18 a 24 anos")).toBeOnTheScreen();
		expect(screen.getByText("Às vezes")).toBeOnTheScreen();
		expect(
			screen.getByText("Essas respostas não podem ser editadas."),
		).toBeOnTheScreen();
	});
});
