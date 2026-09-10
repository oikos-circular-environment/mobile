import { Observe } from "expo-observe";
import { insertAppError } from "@/libs/moderation/app-errors-store";
import { logAppErrorEvent } from "@/libs/observe-events";

export function recordAppError(
	error: Error,
	route?: string,
	componentStack?: string,
	severity: "error" | "fatal" = "error",
) {
	logAppErrorEvent(error.message, route, severity);
	Observe.reportError(error);
	insertAppError({
		message: error.message,
		stack: error.stack,
		componentStack,
		route,
		severity,
	}).catch(err => {
		console.warn("[app-errors] falha ao persistir erro local", err);
	});
}
