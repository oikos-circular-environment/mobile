import { usePathname } from "expo-router";
import { useEffect } from "react";
import { recordAppError } from "@/libs/moderation/record-app-error";

export function useRecordScreenError(error: Error) {
	const route = usePathname();

	useEffect(() => {
		recordAppError(error, route);
	}, [error, route]);
}
