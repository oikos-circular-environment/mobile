type Listener = (sessionId: string) => void;

const listeners = new Set<Listener>();

export const surveyParticipantSyncBus = {
	subscribe(fn: Listener) {
		listeners.add(fn);
		return () => {
			listeners.delete(fn);
		};
	},
	emit(sessionId: string) {
		for (const fn of listeners) fn(sessionId);
	},
};

export function subscribeParticipantSync(listener: Listener) {
	return surveyParticipantSyncBus.subscribe(listener);
}

export function emitParticipantSync(sessionId: string) {
	surveyParticipantSyncBus.emit(sessionId);
}
