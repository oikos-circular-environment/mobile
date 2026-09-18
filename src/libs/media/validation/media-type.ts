export function mediaTypeFromFileName(fileName: string): "photo" | "video" {
	const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
	return ["mp4", "mov", "avi", "webm", "mkv"].includes(ext) ? "video" : "photo";
}
