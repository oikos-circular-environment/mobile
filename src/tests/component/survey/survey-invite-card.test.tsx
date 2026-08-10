import { render, screen, userEvent } from "@testing-library/react-native";
import * as Clipboard from "expo-clipboard";
import { CopyIcon, UserRoundIcon } from "lucide-react-native";
import {
	SurveyInviteCard,
	SurveyInviteCardActions,
	SurveyInviteCardDescription,
	SurveyInviteCardHeader,
	SurveyInviteCardInfo,
	SurveyInviteCardInfoItem,
	SurveyInviteCardInfoItemContent,
	SurveyInviteCardInfoItemLabel,
	SurveyInviteCardInfoItemValue,
	SurveyInviteCardPersonaBadge,
	SurveyInviteCardStages,
	SurveyInviteCardTitle,
} from "@/components/survey/survey-invite-card";
import { Button, ButtonText } from "@/components/ui/button";

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
			<SurveyInviteCard>
				<SurveyInviteCardHeader />
				<SurveyInviteCardTitle>Ajude a melhorar o Oikos</SurveyInviteCardTitle>
				<SurveyInviteCardDescription>
					Participe de uma pesquisa rápida.
				</SurveyInviteCardDescription>
				<SurveyInviteCardActions>
					<Button variant="secondary" className="flex-1 h-12">
						<ButtonText>Participar</ButtonText>
					</Button>
				</SurveyInviteCardActions>
			</SurveyInviteCard>,
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
			<SurveyInviteCard>
				<SurveyInviteCardHeader>
					<SurveyInviteCardPersonaBadge>
						Coletor(a)
					</SurveyInviteCardPersonaBadge>
				</SurveyInviteCardHeader>
				<SurveyInviteCardTitle>Continue de onde parou</SurveyInviteCardTitle>
				<SurveyInviteCardDescription>
					Você está na Etapa 2 de 4.
				</SurveyInviteCardDescription>
				<SurveyInviteCardInfo>
					<SurveyInviteCardInfoItem>
						<SurveyInviteCardInfoItemContent>
							<SurveyInviteCardInfoItemLabel>
								Seu perfil
							</SurveyInviteCardInfoItemLabel>
							<SurveyInviteCardInfoItemValue>
								Coletor(a)
							</SurveyInviteCardInfoItemValue>
						</SurveyInviteCardInfoItemContent>
						<UserRoundIcon size={18} color="#ffffffcc" />
					</SurveyInviteCardInfoItem>
					<SurveyInviteCardInfoItem>
						<SurveyInviteCardInfoItemContent>
							<SurveyInviteCardInfoItemLabel>
								Seu código
							</SurveyInviteCardInfoItemLabel>
							<SurveyInviteCardInfoItemValue>
								PSQ-7X29-QK41
							</SurveyInviteCardInfoItemValue>
						</SurveyInviteCardInfoItemContent>
						<CopyIcon size={16} color="#ffffffcc" />
					</SurveyInviteCardInfoItem>
				</SurveyInviteCardInfo>
				<SurveyInviteCardStages
					items={[
						{ code: "S1", status: "done" },
						{ code: "S2", status: "current", currentLabel: "S2" },
						{ code: "S3", status: "upcoming" },
						{ code: "S4", status: "upcoming" },
					]}
				/>
			</SurveyInviteCard>,
		);

		expect(screen.getByText("PSQ-7X29-QK41")).toBeOnTheScreen();
		expect(screen.getAllByText("Coletor(a)").length).toBeGreaterThan(0);
	});

	it("copia o código do participante ao tocar em 'Seu código'", async () => {
		const user = userEvent.setup();
		await render(
			<SurveyInviteCard>
				<SurveyInviteCardInfo>
					<SurveyInviteCardInfoItem
						onPress={() => Clipboard.setStringAsync("PSQ-7X29-QK41")}
					>
						<SurveyInviteCardInfoItemContent>
							<SurveyInviteCardInfoItemLabel>
								Seu código
							</SurveyInviteCardInfoItemLabel>
							<SurveyInviteCardInfoItemValue>
								PSQ-7X29-QK41
							</SurveyInviteCardInfoItemValue>
						</SurveyInviteCardInfoItemContent>
						<CopyIcon size={16} color="#ffffffcc" />
					</SurveyInviteCardInfoItem>
				</SurveyInviteCardInfo>
			</SurveyInviteCard>,
		);

		await user.press(screen.getByText("PSQ-7X29-QK41"));

		expect(Clipboard.setStringAsync).toHaveBeenCalledWith("PSQ-7X29-QK41");
	});
});
