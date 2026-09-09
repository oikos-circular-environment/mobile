import * as Application from "expo-application";
import * as Device from "expo-device";
import { Dimensions, Platform } from "react-native";
import type { SupportEnvironment } from "@/libs/types/support";

function screenSizeBucket(): NonNullable<SupportEnvironment["screen_size"]> {
	const { width } = Dimensions.get("window");
	if (width < 360) return "SMALL";
	if (width < 600) return "MEDIUM";
	return "LARGE";
}

function resolvePlatform(): SupportEnvironment["platform"] {
	if (Platform.OS === "android") return "android";
	if (Platform.OS === "ios") return "ios";
	return "web";
}

export function getSupportDeviceInfo(): Pick<
	SupportEnvironment,
	"platform" | "app_version" | "os_version" | "screen_size"
> {
	return {
		platform: resolvePlatform(),
		app_version: Application.nativeApplicationVersion ?? "0.0.0",
		os_version: Device.osVersion ?? undefined,
		screen_size: screenSizeBucket(),
	};
}
