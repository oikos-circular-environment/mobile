export const TICK_MS = 30_000;
export const STALE_SENDING_MS = 60_000;

export interface ExecutionState {
	isActive: boolean;
	tasksSignature: string;
}

export function countResolved(signature: string): number {
	if (!signature) return 0;
	return signature
		.split(",")
		.filter(item => item.endsWith(":done") || item.endsWith(":abandoned"))
		.length;
}

export function triggerDrain(
	sessionId: string,
	drain: (sessionId: string) => Promise<void>,
) {
	drain(sessionId).catch(() => {});
}

export interface LifecycleDependencies {
	getActiveSessionId: () => string | null;
	getActiveExecutionState: () => ExecutionState;
	drain: (sessionId: string) => Promise<void>;
	setInterval: (
		callback: () => void,
		ms: number,
	) => ReturnType<typeof setInterval>;
	clearInterval: (id: ReturnType<typeof setInterval>) => void;
}

export interface Lifecycle {
	startTick: () => void;
	stopTick: () => void;
	handleAppStateActive: () => void;
	handleNetInfoConnected: (isConnected: boolean) => void;
	handleStoreChange: () => void;
	cleanup: () => void;
}

export function createSurveyQueueLifecycle(
	deps: LifecycleDependencies,
): Lifecycle {
	let tickInterval: ReturnType<typeof setInterval> | null = null;
	let lastIsActive = deps.getActiveExecutionState().isActive;
	let lastTasksSignature = deps.getActiveExecutionState().tasksSignature;
	let wasConnected = false;

	function startTick() {
		if (tickInterval) return;
		tickInterval = deps.setInterval(() => {
			const sessionId = deps.getActiveSessionId();
			if (sessionId) triggerDrain(sessionId, deps.drain);
		}, TICK_MS);
	}

	function stopTick() {
		if (!tickInterval) return;
		deps.clearInterval(tickInterval);
		tickInterval = null;
	}

	function handleAppStateActive() {
		const sessionId = deps.getActiveSessionId();
		if (sessionId) triggerDrain(sessionId, deps.drain);
	}

	function handleNetInfoConnected(isConnected: boolean) {
		if (isConnected && !wasConnected) {
			const sessionId = deps.getActiveSessionId();
			if (sessionId) triggerDrain(sessionId, deps.drain);
		}
		wasConnected = isConnected;
	}

	function handleStoreChange() {
		const state = deps.getActiveSessionId();
		if (state) {
			startTick();
		} else {
			stopTick();
		}

		const execution = deps.getActiveExecutionState();
		if (lastIsActive && !execution.isActive) {
			const sessionId = deps.getActiveSessionId();
			if (sessionId) triggerDrain(sessionId, deps.drain);
		}

		const resolvedBefore = countResolved(lastTasksSignature);
		const resolvedNow = countResolved(execution.tasksSignature);
		if (resolvedNow > resolvedBefore) {
			const sessionId = deps.getActiveSessionId();
			if (sessionId) triggerDrain(sessionId, deps.drain);
		}

		lastIsActive = execution.isActive;
		lastTasksSignature = execution.tasksSignature;
	}

	function cleanup() {
		stopTick();
	}

	return {
		startTick,
		stopTick,
		handleAppStateActive,
		handleNetInfoConnected,
		handleStoreChange,
		cleanup,
	};
}
