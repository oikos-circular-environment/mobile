import NetInfo from "@react-native-community/netinfo";
import { drainOutbox } from "./outbox";

export function initSurveyQueue(getActiveSessionId: () => string | null) {
	let wasConnected = false;

	return NetInfo.addEventListener(state => {
		const isConnected = Boolean(
			state.isConnected && state.isInternetReachable !== false,
		);
		if (isConnected && !wasConnected) {
			const sessionId = getActiveSessionId();
			if (sessionId) drainOutbox(sessionId);
		}
		wasConnected = isConnected;
	});
}
