import { render, screen, userEvent } from "@testing-library/react-native";
import { FloatingIndicator } from "@/components/survey/floating-indicator";

describe("FloatingIndicator — componente", () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("exibe a contagem de tarefas e o tempo decorrido", async () => {
		await render(
			<FloatingIndicator
				completedCount={3}
				totalCount={7}
				elapsedLabel="02:41"
				onPress={jest.fn()}
			/>,
		);

		expect(screen.getByText("3/7")).toBeOnTheScreen();
		expect(screen.getByText("02:41")).toBeOnTheScreen();
	});

	it("chama onPress ao ser pressionado", async () => {
		const user = userEvent.setup();
		const onPress = jest.fn();
		await render(
			<FloatingIndicator
				completedCount={3}
				totalCount={7}
				elapsedLabel="02:41"
				onPress={onPress}
			/>,
		);

		await user.press(screen.getByText("3/7"));

		expect(onPress).toHaveBeenCalledTimes(1);
	});
});
