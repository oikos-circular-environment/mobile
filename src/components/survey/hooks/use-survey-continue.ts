import { useRouter } from "expo-router";
import { useSurveyExecutionStore } from "@/stores/survey-execution-store";
import { useSurveyStore } from "@/stores/survey-store";

export function useSurveyContinue() {
	const router = useRouter();
	const status = useSurveyStore(s => s.status);
	const suiteRunId = useSurveyExecutionStore(s => s.suiteRunId);
	const suiteCode = useSurveyExecutionStore(s => s.suiteCode);
	const suiteIndex = useSurveyExecutionStore(s => s.suiteIndex);
	const suiteQueue = useSurveyExecutionStore(s => s.suiteQueue);
	const setPaused = useSurveyExecutionStore(s => s.setPaused);
	const beginSuite = useSurveyExecutionStore(s => s.beginSuite);

	const hasResumableSuite =
		Boolean(suiteRunId) && suiteQueue[suiteIndex] === suiteCode;

	return () => {
		if (status === "ABANDONED" || status === "COMPLETED") return;

		if (hasResumableSuite) {
			setPaused(false);
			beginSuite();
			router.dismissTo("/(tabs)/(home)" as never);
		} else if (suiteQueue.length > 0 && suiteIndex >= suiteQueue.length) {
			router.replace("/survey/closing-comment");
		} else {
			router.replace("/survey/suite-intro");
		}
	};
}
