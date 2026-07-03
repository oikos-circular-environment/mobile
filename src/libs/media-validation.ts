import { File } from "expo-file-system";

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export const ALLOWED_MIME_TYPES: Record<
	string,
	{ ext: string; type: "PHOTO" | "VIDEO" }
> = {
	"image/jpeg": { ext: "jpeg", type: "PHOTO" },
	"image/png": { ext: "png", type: "PHOTO" },
	"video/mp4": { ext: "mp4", type: "VIDEO" },
	"video/quicktime": { ext: "mov", type: "VIDEO" },
	"video/webm": { ext: "webm", type: "VIDEO" },
};

export function isValidMimeType(mimeType: string | undefined): boolean {
	if (!mimeType) return false;
	return mimeType in ALLOWED_MIME_TYPES;
}

export function formatFileSize(bytes: number): string {
	const mb = bytes / (1024 * 1024);
	return mb < 10 ? `${mb.toFixed(1)} MB` : `${Math.round(mb)} MB`;
}

export function getFileSize(uri: string): number | undefined {
	try {
		const file = new File(uri);
		if (file.exists) return file.size;
	} catch {
		// ignore — caller handles undefined
	}
	return undefined;
}
