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
