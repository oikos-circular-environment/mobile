import { render, screen } from "@testing-library/react-native";
import { SurveyProgress } from "@/components/survey/survey-progress";

describe("SurveyProgress — componente", () => {
	it("exibe a etapa atual e o total", async () => {
		await render(<SurveyProgress currentStep={1} totalSteps={4} />);

		expect(screen.getByText("Etapa 1 de 4")).toBeOnTheScreen();
	});

	it("calcula a porcentagem corretamente", async () => {
		await render(<SurveyProgress currentStep={1} totalSteps={4} />);

		expect(screen.getByText("25%")).toBeOnTheScreen();
	});

	it("arredonda a porcentagem quando a divisão não é exata", async () => {
		await render(<SurveyProgress currentStep={2} totalSteps={3} />);

		expect(screen.getByText("67%")).toBeOnTheScreen();
	});
});
