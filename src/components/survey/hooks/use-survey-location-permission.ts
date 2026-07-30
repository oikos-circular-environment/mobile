import * as Location from "expo-location";
import { useCallback, useState } from "react";

type SurveyLocationPermissionStatus = "idle" | "requesting" | "denied";

export function useSurveyLocationPermission() {
	const [status, setStatus] = useState<SurveyLocationPermissionStatus>("idle");

	const request = useCallback(async () => {
		setStatus("requesting");

		const current = await Location.getForegroundPermissionsAsync();
		if (current.status === "granted") {
			return true;
		}

		const requested = await Location.requestForegroundPermissionsAsync();
		if (requested.status === "granted") {
			return true;
		}

		setStatus("denied");
		return false;
	}, []);

	return { status, request };
}
