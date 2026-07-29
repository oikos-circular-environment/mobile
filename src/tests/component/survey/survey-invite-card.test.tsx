import { render, screen, userEvent } from "@testing-library/react-native";
import { UserIcon } from "lucide-react-native";
import { SurveyInviteCard } from "@/components/survey/survey-invite-card";

const stages = [
	{ code: "S1", icon: UserIcon },
	{ code: "S2", icon: UserIcon, current: true, currentLabel: "Atual" },
	{ code: "S3", icon: UserIcon },
];

describe("SurveyInviteCard — componente", () => {
	it("exibe persona, título, descrição e código do participante", async () => {
		await render(
			<SurveyInviteCard
				personaLabel="Coletor(a)"
				title="Ajude a melhorar o Oikos"
				description="Participe de uma pesquisa rápida."
				participantCode="PSQ-7X29-QK41"
				stages={stages}
				ctaLabel="Continuar"
				onPressCta={jest.fn()}
				onPressDetails={jest.fn()}
			/>,
		);

		expect(screen.getByText("Ajude a melhorar o Oikos")).toBeOnTheScreen();
		expect(
			screen.getByText("Participe de uma pesquisa rápida."),
		).toBeOnTheScreen();
		expect(screen.getByText("PSQ-7X29-QK41")).toBeOnTheScreen();
		expect(screen.getAllByText("Coletor(a)").length).toBeGreaterThan(0);
	});

	it("chama onPressCta e onPressDetails de forma independente", async () => {
		const user = userEvent.setup();
		const onPressCta = jest.fn();
		const onPressDetails = jest.fn();
		await render(
			<SurveyInviteCard
				personaLabel="Coletor(a)"
				title="Título"
				description="Descrição"
				stages={stages}
				ctaLabel="Continuar"
				onPressCta={onPressCta}
				onPressDetails={onPressDetails}
			/>,
		);

		await user.press(screen.getByText("Ver detalhes da pesquisa"));
		expect(onPressDetails).toHaveBeenCalledTimes(1);
		expect(onPressCta).not.toHaveBeenCalled();

		await user.press(screen.getByText("Continuar"));
		expect(onPressCta).toHaveBeenCalledTimes(1);
	});

	it("não exibe o bloco de código quando não informado", async () => {
		await render(
			<SurveyInviteCard
				personaLabel="Coletor(a)"
				title="Título"
				description="Descrição"
				stages={stages}
				ctaLabel="Continuar"
				onPressCta={jest.fn()}
				onPressDetails={jest.fn()}
			/>,
		);

		expect(screen.queryByText("Seu código")).not.toBeOnTheScreen();
	});
});
