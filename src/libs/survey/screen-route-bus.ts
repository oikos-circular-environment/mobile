export interface ScreenRouteEvent {
	route: string;
}

type Listener = (event: ScreenRouteEvent) => void;

const listeners = new Set<Listener>();

export const screenRouteBus = {
	subscribe(fn: Listener) {
		listeners.add(fn);
		return () => {
			listeners.delete(fn);
		};
	},
	emit(event: ScreenRouteEvent) {
		for (const fn of listeners) fn(event);
	},
};
