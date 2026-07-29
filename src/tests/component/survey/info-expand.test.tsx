import { render, screen, userEvent } from "@testing-library/react-native";
import { Text } from "react-native";
import { InfoExpand } from "@/components/survey/info-expand";

describe("InfoExpand — componente", () => {
	it("mantém o conteúdo escondido por padrão", async () => {
		await render(
			<InfoExpand label="O que é essa pesquisa?">
				<Text>Suas respostas são anônimas.</Text>
			</InfoExpand>,
		);

		expect(
			screen.queryByText("Suas respostas são anônimas."),
		).not.toBeOnTheScreen();
	});

	it("revela o conteúdo ao pressionar o cabeçalho, e esconde de novo no segundo toque", async () => {
		const user = userEvent.setup();
		await render(
			<InfoExpand label="O que é essa pesquisa?">
				<Text>Suas respostas são anônimas.</Text>
			</InfoExpand>,
		);

		await user.press(screen.getByText("O que é essa pesquisa?"));
		expect(screen.getByText("Suas respostas são anônimas.")).toBeOnTheScreen();

		await user.press(screen.getByText("O que é essa pesquisa?"));
		expect(
			screen.queryByText("Suas respostas são anônimas."),
		).not.toBeOnTheScreen();
	});

	it("respeita defaultOpen", async () => {
		await render(
			<InfoExpand label="O que é essa pesquisa?" defaultOpen>
				<Text>Suas respostas são anônimas.</Text>
			</InfoExpand>,
		);

		expect(screen.getByText("Suas respostas são anônimas.")).toBeOnTheScreen();
	});
});
