import type { NetworkTelemetryEvent } from "@/libs/network-telemetry-bus";
import { networkTelemetryBus } from "@/libs/network-telemetry-bus";

/**
 * `true` — o parâmetro precisa estar presente, com qualquer valor.
 * `string` — o parâmetro precisa ter exatamente esse valor.
 * `{ not: string }` — precisa estar presente com um valor diferente do informado.
 * Existe para filtros sempre enviados na query com um valor padrão (como o raio de
 * busca) — `true` casaria já na primeira carga, sem o participante ter alterado nada.
 */
export type QueryMatcher = string | true | { not: string };

export type SuccessSignal =
	| {
			kind: "api";
			method: string;
			path_pattern: string;
			status: number;
			query?: Record<string, QueryMatcher>;
	  }
	| { kind: "screen"; route: string };

export interface SuccessRule {
	mode: "any" | "all";
	signals: SuccessSignal[];
}

/**
 * `:param` (rotas de API) e `[param]` (rotas do expo-router) viram um segmento
 * qualquer — casam `/v1/companies/:id/addresses` com `/v1/companies/abc123/addresses`
 * e `/market/[companyId]` com `/market/abc123`.
 */
function pathMatchesPattern(path: string, pattern: string): boolean {
	const [pathname] = path.split("?");
	const regex = new RegExp(
		`^${pattern
			.split("/")
			.map(segment =>
				segment.startsWith(":") ||
				(segment.startsWith("[") && segment.endsWith("]"))
					? "[^/]+"
					: segment,
			)
			.join("/")}$`,
	);
	return regex.test(pathname ?? "");
}

function queryMatches(
	expected: Record<string, QueryMatcher> | undefined,
	actual: Record<string, string> | undefined,
): boolean {
	if (!expected) return true;
	return Object.entries(expected).every(([key, value]) => {
		const actualValue = actual?.[key];
		if (value === true) return actualValue !== undefined;
		if (typeof value === "object") {
			return actualValue !== undefined && actualValue !== value.not;
		}
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
			if (
				signal.kind === "screen" &&
				pathMatchesPattern(pathname, signal.route)
			) {
				evaluate(index);
			}
		});
	}

	function dispose() {
		unsubscribeNetwork();
	}

	return { notifyScreen, dispose };
}
