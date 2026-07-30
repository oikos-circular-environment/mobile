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
				title: "Pesquisa de usabilidade",
				subtitle: "Continue de onde parou",
				onPress: () => router.push("/survey"),
			};
		}

		return {
			variant: "invite" as const,
			title: "Pesquisa de usabilidade",
			subtitle: "Participe e ajude a melhorar o app",
			onPress: () => router.push("/survey"),
		};
	}, [status, router]);
}
