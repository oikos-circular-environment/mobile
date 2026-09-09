import type { SupportLastError } from "@/libs/types/support";

let lastError: SupportLastError | null = null;

export function setLastError(error: Omit<SupportLastError, "occurred_at">) {
	lastError = { ...error, occurred_at: new Date() };
}

export function getLastError(): SupportLastError | null {
	return lastError;
}

export function clearLastError() {
	lastError = null;
}
