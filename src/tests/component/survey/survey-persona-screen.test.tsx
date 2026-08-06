import { render, screen, userEvent } from "@testing-library/react-native";
import SurveyPersonaScreen from "@/app/survey/persona";
import { useSurveyProtocol } from "@/components/survey/hooks/use-survey-protocol";
import { useSurveyDraftStore } from "@/stores/survey-draft-store";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
	useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/components/survey/hooks/use-survey-protocol");

const protocolFixture = {
	key: "oikos-walkthrough",
	version: 1,
	personas: [
		{
			key: "COLLECTOR",
			label: "Coletor(a)",
			description: "Você coleta materiais recicláveis.",
			suites: [
				{ suite_code: "S1", specific_objectives: [] },
				{ suite_code: "S2", specific_objectives: [] },
				{ suite_code: "S3", specific_objectives: [] },
			],
		},
		{
			key: "CITIZEN",
			label: "Cidadão",
			description: "Você mora na cidade.",
			suites: [
				{ suite_code: "S1", specific_objectives: [] },
				{ suite_code: "S2", specific_objectives: [] },
				{ suite_code: "S6", specific_objectives: [] },
			],
		},
	],
	suites: [],
	tasks: [],
	questions: Array.from({ length: 7 }, (_, i) => ({
		key: `q${i}`,
		scope: "SCREENER",
		type: "CHOICE",
		position: i,
		label: "x",
		required: true,
	})),
};

describe("SurveyPersonaScreen", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		mockPush.mockClear();
		useSurveyDraftStore.getState().reset();
		jest.mocked(useSurveyProtocol).mockReturnValue({
			data: protocolFixture,
			isLoading: false,
		} as never);
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("lista as personas do protocolo e mantém Continuar desabilitado sem escolha", async () => {
		await render(<SurveyPersonaScreen />);

		expect(screen.getByText("Coletor(a)")).toBeOnTheScreen();
		expect(screen.getByText("Cidadão")).toBeOnTheScreen();
		expect(screen.getByText("Continuar").parent).toBeDisabled();
	});

	it("escolher uma persona e continuar grava no draft e navega para caracterização", async () => {
		const user = userEvent.setup();
		await render(<SurveyPersonaScreen />);

		await user.press(screen.getByText("Coletor(a)"));
		await user.press(screen.getByText("Continuar"));

		expect(useSurveyDraftStore.getState().persona).toBe("COLLECTOR");
		expect(mockPush).toHaveBeenCalledWith("/survey/characterization");
	});
});
