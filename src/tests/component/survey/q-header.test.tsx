import { render, screen } from "@testing-library/react-native";
import { QHeader } from "@/components/survey/q-header";

describe("QHeader — componente", () => {
	it("exibe a categoria e a contagem de perguntas", async () => {
		await render(
			<QHeader categoryLabel="Categoria" currentIndex={1} totalCount={8} />,
		);

		expect(screen.getByText("Categoria")).toBeOnTheScreen();
		expect(screen.getByText("1/8")).toBeOnTheScreen();
	});
});
