import { NativeModules } from "react-native";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

/**
 * "evidence" — complaint/resolution media: 1920px wide, 80% quality
 * "avatar"   — profile/company pictures:  512px wide, 85% quality
 */
export type CompressionPreset = "evidence" | "avatar";

const IMAGE_PRESETS: Record<CompressionPreset, { maxWidth: number; quality: number }> = {
	evidence: { maxWidth: 1920, quality: 0.8 },
	avatar: { maxWidth: 512, quality: 0.85 },
};

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

export async function compressImage(
	uri: string,
	preset: CompressionPreset = "evidence",
): Promise<string> {
	const { maxWidth, quality } = IMAGE_PRESETS[preset];
	try {
		const result = await manipulateAsync(
			uri,
			[{ resize: { width: maxWidth } }],
			{ compress: quality, format: SaveFormat.JPEG },
		);
		return result.uri;
	} catch {
		return uri;
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
	} catch {
		return uri;
	}
}

// Convenience wrapper for upload hooks — picks the right compressor by mediaType.
export async function compressMedia(
	uri: string,
	mediaType: "photo" | "video",
	preset: CompressionPreset = "evidence",
): Promise<string> {
	return mediaType === "video" ? compressVideo(uri) : compressImage(uri, preset);
}
