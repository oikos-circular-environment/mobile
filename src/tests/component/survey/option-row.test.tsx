import { render, screen, userEvent } from "@testing-library/react-native";
import { OptionRow } from "@/components/survey/option-row";

describe("OptionRow — componente", () => {
	it("exibe título e descrição", async () => {
		await render(
			<OptionRow
				title="Coletor(a)"
				description="Recolhe materiais recicláveis"
				onPress={jest.fn()}
			/>,
		);

		expect(screen.getByText("Coletor(a)")).toBeOnTheScreen();
		expect(screen.getByText("Recolhe materiais recicláveis")).toBeOnTheScreen();
	});

	it("chama onPress ao ser pressionado", async () => {
		const user = userEvent.setup();
		const onPress = jest.fn();
		await render(<OptionRow title="Coletor(a)" onPress={onPress} />);

		await user.press(screen.getByText("Coletor(a)"));

		expect(onPress).toHaveBeenCalledTimes(1);
	});
});
