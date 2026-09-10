import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { Observe } from "expo-observe";
import { type CompressionPreset, IMAGE_PRESETS } from "./presets";

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
	} catch (error) {
		Observe.reportError(error);
		return uri;
	}
}
