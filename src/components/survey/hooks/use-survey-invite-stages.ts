import type { SurveyInviteStage } from "@/components/survey/survey-invite-card";
import { useSurveyStore } from "@/stores/survey-store";
import { useSurveyProtocol } from "./use-survey-protocol";

export function useSurveyInviteStages() {
	const status = useSurveyStore(s => s.status);
	const persona = useSurveyStore(s => s.persona);
	const currentSuiteCode = useSurveyStore(s => s.currentSuiteCode);
	const { data: protocol } = useSurveyProtocol();

	const personaDefinition = protocol?.personas.find(p => p.key === persona);
	const suiteQueue = personaDefinition?.suites.map(s => s.suite_code) ?? [];

	if (status === "COMPLETED") {
		return suiteQueue.map<SurveyInviteStage>(code => ({
			code,
			status: "completed",
			currentLabel: code,
		}));
	}

	if (status === "IN_PROGRESS" || status === "ABANDONED") {
		const currentIndex = currentSuiteCode
			? suiteQueue.indexOf(currentSuiteCode)
			: -1;

		return suiteQueue.map<SurveyInviteStage>((code, index) => ({
			code,
			status:
				index < currentIndex
					? "done"
					: index === currentIndex
						? "current"
						: "upcoming",
			currentLabel: code,
		}));
	}

	return [];
}
