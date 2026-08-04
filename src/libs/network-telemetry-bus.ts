/**
 * Barramento de telemetria de rede — o cliente de rede publica o resultado de cada
 * requisição aqui, sem saber quem assina nem que a pesquisa existe (A3). Genérico de
 * propósito: fica fora de `libs/survey/`.
 */
export interface NetworkTelemetryEvent {
	method: string;
	path: string;
	status: number;
	query?: Record<string, string>;
}

type Listener = (event: NetworkTelemetryEvent) => void;

const listeners = new Set<Listener>();

export const networkTelemetryBus = {
	subscribe(fn: Listener) {
		listeners.add(fn);
		return () => {
			listeners.delete(fn);
		};
	},
	emit(event: NetworkTelemetryEvent) {
		for (const fn of listeners) fn(event);
	},
};
