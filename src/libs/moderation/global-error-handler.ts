import type { ErrorUtils as RNErrorUtils } from "react-native";
import { setLastError } from "@/libs/moderation/last-error-store";

declare const ErrorUtils: RNErrorUtils;

const originalHandler = ErrorUtils.getGlobalHandler();

ErrorUtils.setGlobalHandler((error, isFatal) => {
	setLastError({
		message: error instanceof Error ? error.message : String(error),
		stack: error instanceof Error ? error.stack : undefined,
	});
	originalHandler(error, isFatal);
});
