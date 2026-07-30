import { useRouter } from "expo-router";
import { useMemo } from "react";
import { useSurveyStore } from "@/stores/survey-store";

export function useSurveyInviteBanner() {
	const status = useSurveyStore(s => s.status);
	const router = useRouter();

	return useMemo(() => {
		if (status === "COMPLETED") {
			return null;
		}

		if (status === "IN_PROGRESS" || status === "ABANDONED") {
			return {
				variant: "resume" as const,
				title: "Continue de onde parou",
				description: "Você tem uma pesquisa de usabilidade em andamento.",
				ctaLabel: "Continuar",
				onPress: () => router.push("/survey"),
			};
		}

		return {
			variant: "invite" as const,
			title: "Ajude a melhorar o Oikos",
			description:
				"Participe de uma pesquisa rápida enquanto usa o aplicativo normalmente.",
			ctaLabel: "Participar",
			onPress: () => router.push("/survey"),
		};
	}, [status, router]);
}
