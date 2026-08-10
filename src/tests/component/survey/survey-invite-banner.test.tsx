import { render, screen, userEvent } from "@testing-library/react-native";
import * as Clipboard from "expo-clipboard";
import { useSurveyInviteStages } from "@/components/survey/hooks/use-survey-invite-stages";
import { useSurveyInviteVariant } from "@/components/survey/hooks/use-survey-invite-variant";
import { useSurveyParticipantCode } from "@/components/survey/hooks/use-survey-participant-code";
import { useSurveyPersonaLabel } from "@/components/survey/hooks/use-survey-persona-label";
import { SurveyInviteBanner } from "@/components/survey/survey-invite-banner";
import { toast } from "@/components/toast";
import { useSurveyExecutionStore } from "@/stores/survey-execution-store";
import { useSurveyStore } from "@/stores/survey-store";

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockDismissTo = jest.fn();

jest.mock("expo-router", () => ({
	useRouter: () => ({
		push: mockPush,
		replace: mockReplace,
		dismissTo: mockDismissTo,
	}),
}));

jest.mock("@/components/survey/hooks/use-survey-invite-variant");
jest.mock("@/components/survey/hooks/use-survey-invite-stages");
jest.mock("@/components/survey/hooks/use-survey-persona-label");
jest.mock("@/components/survey/hooks/use-survey-participant-code");

jest.mock("expo-clipboard", () => ({
	setStringAsync: jest.fn().mockResolvedValue(true),
}));

jest.mock("@/components/toast", () => ({
	toast: { success: jest.fn(), error: jest.fn() },
}));

const stagesFixture = [
	{ code: "S1", status: "done" as const, currentLabel: "S1" },
	{ code: "S2", status: "current" as const, currentLabel: "S2" },
	{ code: "S3", status: "upcoming" as const, currentLabel: "S3" },
	{ code: "S4", status: "upcoming" as const, currentLabel: "S4" },
];

describe("SurveyInviteBanner", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.mocked(useSurveyInviteVariant).mockReturnValue(null);
		jest.mocked(useSurveyInviteStages).mockReturnValue([]);
		jest.mocked(useSurveyPersonaLabel).mockReturnValue(undefined);
		jest.mocked(useSurveyParticipantCode).mockReturnValue(null);
		useSurveyExecutionStore.getState().reset();
		useSurveyStore.getState().reset();
	});

	it("não renderiza nada quando a variante é null", async () => {
		await render(<SurveyInviteBanner />);

		expect(
			screen.queryByText("Ajude a melhorar o Oikos"),
		).not.toBeOnTheScreen();
		expect(screen.queryByText("Continue de onde parou")).not.toBeOnTheScreen();
	});

	it("renderiza a variante invite com CTA Participar", async () => {
		const user = userEvent.setup();
		jest.mocked(useSurveyInviteVariant).mockReturnValue("invite");

		await render(<SurveyInviteBanner />);

		expect(screen.getByText("Ajude a melhorar o Oikos")).toBeOnTheScreen();
		expect(
			screen.getByText(
				"Participe de uma pesquisa rápida enquanto usa o aplicativo normalmente.",
			),
		).toBeOnTheScreen();
		expect(screen.getByText("Participar")).toBeOnTheScreen();

		await user.press(screen.getByText("Participar"));
		expect(mockPush).toHaveBeenCalledWith("/survey");
	});

	it("renderiza a variante resume com copy, etapas e botões", async () => {
		const user = userEvent.setup();
		jest.mocked(useSurveyInviteVariant).mockReturnValue("resume");
		jest.mocked(useSurveyInviteStages).mockReturnValue(stagesFixture);
		jest.mocked(useSurveyPersonaLabel).mockReturnValue("Coletor(a)");
		jest.mocked(useSurveyParticipantCode).mockReturnValue("PSQ-7X29-QK41");

		await render(<SurveyInviteBanner />);

		expect(screen.getByText("Continue de onde parou")).toBeOnTheScreen();
		expect(screen.getByText("Você está na Etapa 2 de 4.")).toBeOnTheScreen();
		expect(screen.getByText("Seu perfil")).toBeOnTheScreen();
		expect(screen.getByText("Seu código")).toBeOnTheScreen();
		expect(screen.getByText("Ver detalhes")).toBeOnTheScreen();
		expect(screen.getByText("Continuar")).toBeOnTheScreen();

		await user.press(screen.getByText("Ver detalhes"));
		expect(mockPush).toHaveBeenCalledWith("/survey/resume");

		useSurveyStore.getState().startSession("session-1", "CITIZEN");
		await user.press(screen.getByText("Continuar"));
		expect(mockReplace).toHaveBeenCalledWith("/survey/suite-intro");
	});

	it("Continuar despausa e volta pro app quando a etapa já está ativa", async () => {
		const user = userEvent.setup();
		jest.mocked(useSurveyInviteVariant).mockReturnValue("resume");
		jest.mocked(useSurveyInviteStages).mockReturnValue(stagesFixture);

		useSurveyStore.getState().startSession("session-1", "CITIZEN");
		useSurveyExecutionStore.getState().initRoteiro(["S1", "S2"]);
		useSurveyExecutionStore.getState().openSuiteIntro({
			code: "S2",
			title: "Etapa 2",
			objective: "Objetivo",
			specificObjectives: [],
			tasks: [],
		});
		useSurveyExecutionStore.getState().beginSuite();
		useSurveyExecutionStore.getState().setPaused(true);

		await render(<SurveyInviteBanner />);

		await user.press(screen.getByText("Continuar"));

		expect(useSurveyExecutionStore.getState().isPaused).toBe(false);
		expect(mockDismissTo).toHaveBeenCalledWith("/(tabs)/(home)");
	});

	it("usa o fallback de descrição quando não há etapa current", async () => {
		jest.mocked(useSurveyInviteVariant).mockReturnValue("resume");
		jest.mocked(useSurveyInviteStages).mockReturnValue([
			{ code: "S1", status: "done" as const, currentLabel: "S1" },
			{ code: "S2", status: "done" as const, currentLabel: "S2" },
		]);

		await render(<SurveyInviteBanner />);

		expect(
			screen.getByText("Você tem uma pesquisa de usabilidade em andamento."),
		).toBeOnTheScreen();
	});

	it("renderiza a variante completed com botão sólido de detalhes", async () => {
		const user = userEvent.setup();
		jest.mocked(useSurveyInviteVariant).mockReturnValue("completed");
		jest
			.mocked(useSurveyInviteStages)
			.mockReturnValue(
				stagesFixture.map(s => ({ ...s, status: "completed" as const })),
			);
		jest.mocked(useSurveyPersonaLabel).mockReturnValue("Coletor(a)");
		jest.mocked(useSurveyParticipantCode).mockReturnValue("PSQ-7X29-QK41");

		await render(<SurveyInviteBanner />);

		expect(screen.getByText("Pesquisa finalizada")).toBeOnTheScreen();
		expect(
			screen.getByText(
				"Sua participação foi concluída. Obrigado por contribuir!",
			),
		).toBeOnTheScreen();
		expect(screen.queryByText("Continuar")).not.toBeOnTheScreen();
		expect(screen.getByText("Ver detalhes")).toBeOnTheScreen();

		await user.press(screen.getByText("Ver detalhes"));
		expect(mockPush).toHaveBeenCalledWith("/survey/resume");
	});

	it("copia o código do participante ao tocar em 'Seu código'", async () => {
		const user = userEvent.setup();
		jest.mocked(useSurveyInviteVariant).mockReturnValue("resume");
		jest.mocked(useSurveyParticipantCode).mockReturnValue("PSQ-7X29-QK41");

		await render(<SurveyInviteBanner />);

		await user.press(screen.getByText("PSQ-7X29-QK41"));

		expect(Clipboard.setStringAsync).toHaveBeenCalledWith("PSQ-7X29-QK41");
		expect(toast.success).toHaveBeenCalledWith("Código copiado!");
	});
});
