import { render, screen, userEvent } from "@testing-library/react-native";
import { SurveyScale } from "@/components/survey/survey-scale";

const options = [
	{ value: 1, label: "Muito difícil" },
	{ value: 2, label: "Difícil" },
	{ value: 3, label: "Neutro" },
	{ value: 4, label: "Fácil" },
	{ value: 5, label: "Muito fácil" },
];

describe("SurveyScale — componente", () => {
	it("exibe o rótulo de cada ponto da escala", async () => {
		await render(<SurveyScale options={options} onChange={jest.fn()} />);

		for (const option of options) {
			expect(screen.getByText(option.label)).toBeOnTheScreen();
		}
	});

	it("chama onChange com o valor pressionado", async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();
		await render(<SurveyScale options={options} onChange={onChange} />);

		await user.press(screen.getByText("Fácil"));

		expect(onChange).toHaveBeenCalledWith(4);
	});

	it("não gerencia seleção internamente — depende do prop value", async () => {
		const onChange = jest.fn();
		const { rerender } = await render(
			<SurveyScale options={options} value={2} onChange={onChange} />,
		);

		await rerender(
			<SurveyScale options={options} value={5} onChange={onChange} />,
		);

		expect(screen.getByText("Muito fácil")).toBeOnTheScreen();
	});
});
