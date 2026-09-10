import { compressImage } from "./compress-image";
import { compressVideo } from "./compress-video";
import type { CompressionPreset } from "./presets";

export async function compressMedia(
	uri: string,
	mediaType: "photo" | "video",
	preset: CompressionPreset = "evidence",
): Promise<string> {
	return mediaType === "video"
		? compressVideo(uri)
		: compressImage(uri, preset);
}
