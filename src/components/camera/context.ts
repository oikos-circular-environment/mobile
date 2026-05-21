import type { CameraView, FlashMode, PermissionResponse } from "expo-camera";
import { createContext, type RefObject, useContext } from "react";
import type { ComplaintCaptureMode } from "@/libs/types/complaint";

export type CameraContextValue = {
	cameraRef: RefObject<CameraView | null>;
	mode: ComplaintCaptureMode;
	isRecording: boolean;
	isModeTransitioning: boolean;
	flash: FlashMode;
	handleModeChange: (mode: ComplaintCaptureMode) => void;
	handleCameraReady: () => void;
	handleCapture: () => Promise<void>;
	toggleFlash: () => void;
	cameraPermission: PermissionResponse | null;
	requestCameraPermission: () => Promise<PermissionResponse>;
	microphonePermission: PermissionResponse | null;
	requestMicrophonePermission: () => Promise<PermissionResponse>;
};

export const CameraContext = createContext<CameraContextValue | null>(null);

export function useCameraContext(): CameraContextValue {
	const ctx = useContext(CameraContext);
	if (!ctx) {
		throw new Error("useCameraContext must be used within Camera");
	}
	return ctx;
}
