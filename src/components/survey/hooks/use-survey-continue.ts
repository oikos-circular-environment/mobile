import { useRouter } from "expo-router";
import { useSurveyExecutionStore } from "@/stores/survey-execution-store";
import { useSurveyStore } from "@/stores/survey-store";

export function useSurveyContinue() {
	const router = useRouter();
	const status = useSurveyStore(s => s.status);
	const isActive = useSurveyExecutionStore(s => s.isActive);
	const suiteIndex = useSurveyExecutionStore(s => s.suiteIndex);
	const suiteQueue = useSurveyExecutionStore(s => s.suiteQueue);
	const setPaused = useSurveyExecutionStore(s => s.setPaused);

	return () => {
		if (status === "ABANDONED" || status === "COMPLETED") return;

		if (isActive) {
			setPaused(false);
			router.dismissTo("/(tabs)/(home)" as never);
		} else if (suiteQueue.length > 0 && suiteIndex >= suiteQueue.length) {
			router.replace("/survey/closing-comment");
		} else {
			router.replace("/survey/suite-intro");
		}
	};
}
