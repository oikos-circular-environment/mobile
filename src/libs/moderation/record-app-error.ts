import { Observe } from "expo-observe";
import { setLastError } from "@/libs/moderation/last-error-store";
import { logAppErrorEvent } from "@/libs/observe-events";

export function recordAppError(
	error: Error,
	route?: string,
	componentStack?: string,
	severity: "error" | "fatal" = "error",
) {
	logAppErrorEvent(error.message, route, severity);
	Observe.reportError(error);
	setLastError({
		message: error.message,
		stack: error.stack,
		component_stack: componentStack,
	});
}
