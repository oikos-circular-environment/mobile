import { Observe } from "expo-observe";
import { NativeModules } from "react-native";

/**
 * Returns true when react-native-compressor's native module is linked and ready.
 * Checks both Old Architecture (NativeModules) and New Architecture (TurboModule proxy).
 */
function isVideoCompressorLinked(): boolean {
	try {
		if (NativeModules.Compressor != null) return true;

		type TurboProxy = { __turboModuleProxy?: (name: string) => unknown };
		const turboProxy = (global as TurboProxy).__turboModuleProxy;
		return turboProxy != null && turboProxy("Compressor") != null;
	} catch {
		return false;
	}
}

export async function compressVideo(uri: string): Promise<string> {
	if (!isVideoCompressorLinked()) return uri;
	try {
		// biome-ignore lint/suspicious/noExplicitAny: require used for lazy-loading native module
		const { Video } = require("react-native-compressor") as any;
		return await Video.compress(uri, {
			compressionMethod: "manual",
			maxSize: 1280,
			bitrate: 2_000_000,
		});
	} catch (error) {
		Observe.reportError(error);
		return uri;
	}
}
