import NetInfo from "@react-native-community/netinfo";
import { AppState } from "react-native";
import { useSurveyStore } from "@/stores/survey-store";
import {
	createSurveyQueueLifecycle,
	type ExecutionState,
	triggerDrain as triggerDrainBase,
} from "./lifecycle";
import { drainOutbox } from "./outbox";

export { TICK_MS } from "./lifecycle";

export function triggerDrain(sessionId: string) {
	triggerDrainBase(sessionId, drainOutbox);
}

export function initSurveyQueue(
	getActiveSessionId: () => string | null,
	getActiveExecutionState: () => ExecutionState,
) {
	const lifecycle = createSurveyQueueLifecycle({
		getActiveSessionId,
		getActiveExecutionState,
		drain: drainOutbox,
		setInterval: (callback, ms) => setInterval(callback, ms),
		clearInterval: id => clearInterval(id),
	});

	const appStateSubscription = AppState.addEventListener(
		"change",
		nextState => {
			if (nextState !== "active") return;
			lifecycle.handleAppStateActive();
		},
	);

	const netInfoUnsubscribe = NetInfo.addEventListener(state => {
		const isConnected = Boolean(
			state.isConnected && state.isInternetReachable !== false,
		);
		lifecycle.handleNetInfoConnected(isConnected);
	});

	const storeUnsubscribe = useSurveyStore.subscribe(() => {
		lifecycle.handleStoreChange();
	});

	return () => {
		appStateSubscription.remove();
		netInfoUnsubscribe();
		storeUnsubscribe();
		lifecycle.cleanup();
	};
}
