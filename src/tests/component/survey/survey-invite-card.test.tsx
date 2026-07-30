import { render, screen, userEvent } from "@testing-library/react-native";
import * as Clipboard from "expo-clipboard";
import { SurveyInviteCard } from "@/components/survey/survey-invite-card";
import { toast } from "@/components/toast";

jest.mock("expo-clipboard", () => ({
	setStringAsync: jest.fn().mockResolvedValue(true),
}));

jest.mock("@/components/toast", () => ({
	toast: { success: jest.fn(), error: jest.fn() },
}));

describe("SurveyInviteCard — componente", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("exibe título e descrição no estado novo, sem badge, grid ou etapas", async () => {
		await render(
			<SurveyInviteCard
				title="Ajude a melhorar o Oikos"
				description="Participe de uma pesquisa rápida."
				ctaLabel="Participar"
				onPressCta={jest.fn()}
			/>,
		);

		expect(screen.getByText("Ajude a melhorar o Oikos")).toBeOnTheScreen();
		expect(
			screen.getByText("Participe de uma pesquisa rápida."),
		).toBeOnTheScreen();
		expect(screen.getByText("Participar")).toBeOnTheScreen();
		expect(screen.queryByText("Seu código")).not.toBeOnTheScreen();
		expect(screen.queryByText("Seu perfil")).not.toBeOnTheScreen();
		expect(
			screen.queryByText("Ver detalhes da pesquisa"),
		).not.toBeOnTheScreen();
	});

	it("exibe persona, código do participante e etapas quando informados", async () => {
		await render(
			<SurveyInviteCard
				title="Continue de onde parou"
				description="Você está na Etapa 2 de 4."
				personaLabel="Coletor(a)"
				participantCode="PSQ-7X29-QK41"
				stages={[
					{ code: "S1", status: "done" },
					{ code: "S2", status: "current", currentLabel: "S2" },
					{ code: "S3", status: "upcoming" },
					{ code: "S4", status: "upcoming" },
				]}
				ctaLabel="Continuar"
				onPressCta={jest.fn()}
				onPressDetails={jest.fn()}
			/>,
		);

		expect(screen.getByText("PSQ-7X29-QK41")).toBeOnTheScreen();
		expect(screen.getAllByText("Coletor(a)").length).toBeGreaterThan(0);
		expect(screen.getByText("Ver detalhes da pesquisa")).toBeOnTheScreen();
	});

	it("copia o código do participante ao tocar em 'Seu código'", async () => {
		const user = userEvent.setup();
		await render(
			<SurveyInviteCard
				title="Continue de onde parou"
				description="Você está na Etapa 2 de 4."
				participantCode="PSQ-7X29-QK41"
				ctaLabel="Continuar"
				onPressCta={jest.fn()}
			/>,
		);

		await user.press(screen.getByText("PSQ-7X29-QK41"));

		expect(Clipboard.setStringAsync).toHaveBeenCalledWith("PSQ-7X29-QK41");
		expect(toast.success).toHaveBeenCalledWith("Código copiado!");
	});

	it("chama onPressCta e onPressDetails de forma independente", async () => {
		const user = userEvent.setup();
		const onPressCta = jest.fn();
		const onPressDetails = jest.fn();
		await render(
			<SurveyInviteCard
				title="Título"
				description="Descrição"
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
});
