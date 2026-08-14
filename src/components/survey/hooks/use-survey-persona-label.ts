import { useSurveyStore } from "@/stores/survey-store";
import { useSurveyProtocol } from "./use-survey-protocol";

export function useSurveyPersonaLabel() {
	const persona = useSurveyStore(s => s.persona);
	const { data: protocol } = useSurveyProtocol();

	return protocol?.personas.find(p => p.key === persona)?.label;
}
