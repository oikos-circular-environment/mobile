export type UploadPhase = "compressing" | "uploading";

export type UploadProgress = {
	phase: UploadPhase;
	current: number;
	total: number;
};

export type OnUploadProgress = (progress: UploadProgress) => void;
