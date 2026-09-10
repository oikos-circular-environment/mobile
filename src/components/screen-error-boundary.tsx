import type { ErrorBoundaryProps } from "expo-router";
import { ErrorFallback } from "@/components/error-fallback";
import { useRecordScreenError } from "@/libs/moderation/use-record-screen-error";

export function ScreenErrorBoundary({ error, retry }: ErrorBoundaryProps) {
	useRecordScreenError(error);

	return <ErrorFallback onRetry={retry} />;
}
