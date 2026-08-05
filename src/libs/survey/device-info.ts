import Constants from "expo-constants";
import { Dimensions, Platform } from "react-native";

export interface SurveyDeviceInfo {
	os: string;
	os_version: string;
	app_version: string;
	screen_size: "SMALL" | "MEDIUM" | "LARGE";
}

function screenSizeBucket(): SurveyDeviceInfo["screen_size"] {
	const { width } = Dimensions.get("window");
	if (width < 360) return "SMALL";
	if (width < 600) return "MEDIUM";
	return "LARGE";
}

export function getSurveyDeviceInfo(): SurveyDeviceInfo {
	return {
		os: Platform.OS,
		os_version: String(Platform.Version),
		app_version:
			Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? "0.0.0",
		screen_size: screenSizeBucket(),
	};
}
