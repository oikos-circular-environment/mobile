import type { ErrorUtils as RNErrorUtils } from "react-native";
import { recordAppError } from "@/libs/moderation/record-app-error";

declare const ErrorUtils: RNErrorUtils;

const originalHandler = ErrorUtils.getGlobalHandler();

ErrorUtils.setGlobalHandler((error, isFatal) => {
	const normalizedError =
		error instanceof Error ? error : new Error(String(error));
	recordAppError(
		normalizedError,
		undefined,
		undefined,
		isFatal ? "fatal" : "error",
	);
	originalHandler(error, isFatal);
});
