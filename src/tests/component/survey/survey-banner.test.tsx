import { render, screen, userEvent } from "@testing-library/react-native";
import { SurveyBanner } from "@/components/survey/survey-banner";

describe("SurveyBanner — componente", () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("exibe o título e o subtítulo", async () => {
		await render(
			<SurveyBanner
				variant="invite"
				title="Ajude a melhorar o Oikos"
				subtitle="Participe da pesquisa"
				onPress={jest.fn()}
			/>,
		);

		expect(screen.getByText("Ajude a melhorar o Oikos")).toBeOnTheScreen();
		expect(screen.getByText("Participe da pesquisa")).toBeOnTheScreen();
	});

	it("não exibe subtítulo quando não informado", async () => {
		await render(
			<SurveyBanner variant="invite" title="Título" onPress={jest.fn()} />,
		);

		expect(screen.queryByText("Participe da pesquisa")).not.toBeOnTheScreen();
	});

	it("chama onPress ao ser pressionado", async () => {
		const user = userEvent.setup();
		const onPress = jest.fn();
		await render(
			<SurveyBanner variant="invite" title="Título" onPress={onPress} />,
		);

		await user.press(screen.getByText("Título"));

		expect(onPress).toHaveBeenCalledTimes(1);
	});
});
