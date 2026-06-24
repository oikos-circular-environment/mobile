type Listener = () => void;

const listeners = new Set<Listener>();

export const sessionBus = {
	subscribe(fn: Listener) {
		listeners.add(fn);
		return () => {
			listeners.delete(fn);
		};
	},
	emit() {
		for (const fn of listeners) fn();
	},
};
