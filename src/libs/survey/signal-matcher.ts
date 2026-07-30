import type { NetworkTelemetryEvent } from "@/libs/network-telemetry-bus";
import { networkTelemetryBus } from "@/libs/network-telemetry-bus";

export type SuccessSignal =
	| {
			kind: "api";
			method: string;
			path_pattern: string;
			status: number;
			query?: Record<string, string | true>;
	  }
	| { kind: "screen"; route: string };

export interface SuccessRule {
	mode: "any" | "all";
	signals: SuccessSignal[];
}

/** `:param` vira um segmento qualquer — casa `/v1/companies/:id/addresses` com `/v1/companies/abc123/addresses`. */
function pathMatchesPattern(path: string, pattern: string): boolean {
	const [pathname] = path.split("?");
	const regex = new RegExp(
		`^${pattern
			.split("/")
			.map(segment => (segment.startsWith(":") ? "[^/]+" : segment))
			.join("/")}$`,
	);
	return regex.test(pathname ?? "");
}

function queryMatches(
	expected: Record<string, string | true> | undefined,
	actual: Record<string, string> | undefined,
): boolean {
	if (!expected) return true;
	return Object.entries(expected).every(([key, value]) => {
		const actualValue = actual?.[key];
		if (value === true) return actualValue !== undefined;
		return actualValue === value;
	});
}

function apiSignalMatches(
	signal: Extract<SuccessSignal, { kind: "api" }>,
	event: NetworkTelemetryEvent,
): boolean {
	return (
		event.method.toUpperCase() === signal.method.toUpperCase() &&
		event.status === signal.status &&
		pathMatchesPattern(event.path, signal.path_pattern) &&
		queryMatches(signal.query, event.query)
	);
}

/**
 * Observa os sinais de uma tarefa e chama `onComplete` quando a regra é satisfeita —
 * `any` no primeiro sinal que casar, `all` só quando todos tiverem ocorrido. Nunca
 * conclui por conta própria sem casamento: um sinal que não casa não faz nada (M06).
 */
export function createTaskSignalWatcher(
	rule: SuccessRule,
	onComplete: () => void,
) {
	const matched = new Set<number>();
	let done = false;

	function evaluate(index: number) {
		if (done) return;
		matched.add(index);

		const satisfied =
			rule.mode === "any"
				? matched.size > 0
				: matched.size === rule.signals.length;

		if (satisfied) {
			done = true;
			onComplete();
		}
	}

	const unsubscribeNetwork = networkTelemetryBus.subscribe(event => {
		rule.signals.forEach((signal, index) => {
			if (signal.kind === "api" && apiSignalMatches(signal, event)) {
				evaluate(index);
			}
		});
	});

	function notifyScreen(pathname: string) {
		rule.signals.forEach((signal, index) => {
			if (signal.kind === "screen" && signal.route === pathname) {
				evaluate(index);
			}
		});
	}

	function dispose() {
		unsubscribeNetwork();
	}

	return { notifyScreen, dispose };
}
