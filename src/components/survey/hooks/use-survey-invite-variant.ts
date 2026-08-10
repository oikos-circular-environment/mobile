import { useSurveyStore } from "@/stores/survey-store";
import { useSurveyProtocol } from "./use-survey-protocol";

export function useSurveyInviteVariant() {
	const status = useSurveyStore(s => s.status);
	const { data: protocol } = useSurveyProtocol();

	if (status === "COMPLETED") return "completed" as const;
	if (status === "IN_PROGRESS" || status === "ABANDONED")
		return "resume" as const;
	if (!protocol) return null;
	return "invite" as const;
}
