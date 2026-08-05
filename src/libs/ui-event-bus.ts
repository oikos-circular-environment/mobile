export interface UiEvent {
	name: string;
	payload?: Record<string, string>;
}

type Listener = (event: UiEvent) => void;

const listeners = new Set<Listener>();

export const uiEventBus = {
	subscribe(fn: Listener) {
		listeners.add(fn);
		return () => {
			listeners.delete(fn);
		};
	},
	emit(event: UiEvent) {
		for (const fn of listeners) fn(event);
	},
};
