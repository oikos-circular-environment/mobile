import { useRouter } from "expo-router";
import { useSurveyParticipantCode } from "@/components/survey/hooks/use-survey-participant-code";
import { useSurveyProtocol } from "@/components/survey/hooks/use-survey-protocol";
import type { SurveyInviteStage } from "@/components/survey/survey-invite-card";
import { useSurveyStore } from "@/stores/survey-store";

export function useSurveyInviteBanner() {
	const status = useSurveyStore(s => s.status);
	const persona = useSurveyStore(s => s.persona);
	const sessionId = useSurveyStore(s => s.sessionId);
	const currentSuiteCode = useSurveyStore(s => s.currentSuiteCode);
	const router = useRouter();
	const { data: protocol } = useSurveyProtocol();
	const participantCode = useSurveyParticipantCode(sessionId);

	if (status === "COMPLETED") {
		return null;
	}

	if (status === "IN_PROGRESS" || status === "ABANDONED") {
		const personaDefinition = protocol?.personas.find(p => p.key === persona);
		const suiteQueue = personaDefinition?.suites.map(s => s.suite_code) ?? [];
		const currentIndex = currentSuiteCode
			? suiteQueue.indexOf(currentSuiteCode)
			: -1;

		const stages: SurveyInviteStage[] = suiteQueue.map((code, index) => ({
			code,
			status:
				index < currentIndex
					? "done"
					: index === currentIndex
						? "current"
						: "upcoming",
			currentLabel: code,
		}));

		return {
			variant: "resume" as const,
			title: "Continue de onde parou",
			description:
				currentIndex >= 0
					? `Você está na Etapa ${currentIndex + 1} de ${suiteQueue.length}.`
					: "Você tem uma pesquisa de usabilidade em andamento.",
			personaLabel: personaDefinition?.label,
			participantCode: participantCode ?? undefined,
			stages: stages.length > 0 ? stages : undefined,
			ctaLabel: "Continuar",
			onPress: () => router.push("/survey/resume"),
		};
	}

	if (!protocol) return null;

	return {
		variant: "invite" as const,
		title: "Ajude a melhorar o Oikos",
		description:
			"Participe de uma pesquisa rápida enquanto usa o aplicativo normalmente.",
		ctaLabel: "Participar",
		onPress: () => router.push("/survey"),
	};
}
