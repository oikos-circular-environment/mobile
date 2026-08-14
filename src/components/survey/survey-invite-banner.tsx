import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
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
import { toast } from "@/components/toast";
import { Button, ButtonText } from "@/components/ui/button";
import { useSurveyStore } from "@/stores/survey-store";
import { useSurveyContinue } from "./hooks/use-survey-continue";
import { useSurveyInviteStages } from "./hooks/use-survey-invite-stages";
import { useSurveyInviteVariant } from "./hooks/use-survey-invite-variant";
import { useSurveyParticipantCode } from "./hooks/use-survey-participant-code";
import { useSurveyPersonaLabel } from "./hooks/use-survey-persona-label";

export function SurveyInviteBanner() {
	const router = useRouter();
	const variant = useSurveyInviteVariant();
	const personaLabel = useSurveyPersonaLabel();
	const sessionId = useSurveyStore(s => s.sessionId);
	const participantCode = useSurveyParticipantCode(sessionId);
	const stages = useSurveyInviteStages();
	const handleContinue = useSurveyContinue();

	const handleCopyCode = async () => {
		if (!participantCode) return;
		await Clipboard.setStringAsync(participantCode);
		toast.success("Código copiado!");
	};

	if (!variant) return null;

	if (variant === "invite") {
		return (
			<SurveyInviteCard>
				<SurveyInviteCardHeader />
				<SurveyInviteCardTitle>Ajude a melhorar o Oikos</SurveyInviteCardTitle>
				<SurveyInviteCardDescription>
					Participe de uma pesquisa rápida enquanto usa o aplicativo
					normalmente.
				</SurveyInviteCardDescription>
				<SurveyInviteCardActions>
					<Button
						variant="secondary"
						className="flex-1 h-12"
						onPress={() => router.push("/survey")}
					>
						<ButtonText>Participar</ButtonText>
					</Button>
				</SurveyInviteCardActions>
			</SurveyInviteCard>
		);
	}

	const currentIndex = stages.findIndex(s => s.status === "current");
	const description =
		currentIndex >= 0
			? `Você está na Etapa ${currentIndex + 1} de ${stages.length}.`
			: "Você tem uma pesquisa de usabilidade em andamento.";

	return (
		<SurveyInviteCard>
			<SurveyInviteCardHeader>
				{personaLabel ? (
					<SurveyInviteCardPersonaBadge>
						{personaLabel}
					</SurveyInviteCardPersonaBadge>
				) : null}
			</SurveyInviteCardHeader>
			<SurveyInviteCardTitle>
				{variant === "completed"
					? "Pesquisa finalizada"
					: "Continue de onde parou"}
			</SurveyInviteCardTitle>
			<SurveyInviteCardDescription>
				{variant === "completed"
					? "Sua participação foi concluída. Obrigado por contribuir!"
					: description}
			</SurveyInviteCardDescription>
			<SurveyInviteCardInfo>
				{personaLabel ? (
					<SurveyInviteCardInfoItem>
						<SurveyInviteCardInfoItemContent>
							<SurveyInviteCardInfoItemLabel>
								Seu perfil
							</SurveyInviteCardInfoItemLabel>
							<SurveyInviteCardInfoItemValue>
								{personaLabel}
							</SurveyInviteCardInfoItemValue>
						</SurveyInviteCardInfoItemContent>
						<UserRoundIcon size={18} color="#ffffffcc" />
					</SurveyInviteCardInfoItem>
				) : null}
				{participantCode ? (
					<SurveyInviteCardInfoItem onPress={handleCopyCode}>
						<SurveyInviteCardInfoItemContent>
							<SurveyInviteCardInfoItemLabel>
								Seu código
							</SurveyInviteCardInfoItemLabel>
							<SurveyInviteCardInfoItemValue>
								{participantCode}
							</SurveyInviteCardInfoItemValue>
						</SurveyInviteCardInfoItemContent>
						<CopyIcon size={16} color="#ffffffcc" />
					</SurveyInviteCardInfoItem>
				) : null}
			</SurveyInviteCardInfo>
			<SurveyInviteCardStages items={stages} />
			<SurveyInviteCardActions>
				{variant === "completed" ? (
					<Button
						variant="secondary"
						className="flex-1 h-12"
						onPress={() => router.push("/survey/resume")}
					>
						<ButtonText>Ver detalhes</ButtonText>
					</Button>
				) : (
					<>
						<Button
							variant="outline"
							className="flex-1 h-12 border-white/30 bg-white/10"
							onPress={() => router.push("/survey/resume")}
						>
							<ButtonText className="text-white">Ver detalhes</ButtonText>
						</Button>
						<Button
							variant="secondary"
							className="flex-1 h-12"
							onPress={handleContinue}
						>
							<ButtonText>Continuar</ButtonText>
						</Button>
					</>
				)}
			</SurveyInviteCardActions>
		</SurveyInviteCard>
	);
}
