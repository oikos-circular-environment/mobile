import { File } from "expo-file-system";

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

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
