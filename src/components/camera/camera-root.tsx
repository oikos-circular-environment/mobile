import {
	type CameraCapturedPicture,
	type CameraView,
	useCameraPermissions,
	useMicrophonePermissions,
} from "expo-camera";
import { type PropsWithChildren, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import type {
	CameraCapturedVideo,
	ComplaintCaptureMode,
} from "@/libs/types/complaint";
import { CameraContext } from "./context";

type CameraRootProps = PropsWithChildren<{
	onCapture: (
		object: CameraCapturedPicture | CameraCapturedVideo,
		type: ComplaintCaptureMode,
	) => void;
	defaultMode?: ComplaintCaptureMode;
}>;

export function CameraRoot({
	children,
	onCapture,
	defaultMode = "photo",
}: CameraRootProps) {
	const cameraRef = useRef<CameraView | null>(null);
	const modeTransitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);

	const [mode, setMode] = useState<ComplaintCaptureMode>(defaultMode);
	const [isRecording, setIsRecording] = useState(false);
	const [isModeTransitioning, setIsModeTransitioning] = useState(false);

	const [cameraPermission, requestCameraPermission] = useCameraPermissions();
	const [microphonePermission, requestMicrophonePermission] =
		useMicrophonePermissions();

	useEffect(() => {
		return () => {
			if (modeTransitionTimeoutRef.current) {
				clearTimeout(modeTransitionTimeoutRef.current);
			}
		};
	}, []);

	const handleModeChange = (nextMode: ComplaintCaptureMode) => {
		if (nextMode === mode || isRecording || isModeTransitioning) return;

		setIsModeTransitioning(true);
		setMode(nextMode);

		if (modeTransitionTimeoutRef.current) {
			clearTimeout(modeTransitionTimeoutRef.current);
		}

		// Fallback: alguns devices podem não disparar onCameraReady ao trocar mode.
		modeTransitionTimeoutRef.current = setTimeout(() => {
			setIsModeTransitioning(false);
		}, 700);
	};

	const handleCameraReady = () => {
		if (!isModeTransitioning) return;

		if (modeTransitionTimeoutRef.current) {
			clearTimeout(modeTransitionTimeoutRef.current);
			modeTransitionTimeoutRef.current = null;
		}

		setIsModeTransitioning(false);
	};

	async function ensureMicrophonePermission() {
		if (microphonePermission?.granted) return true;
		const permission = await requestMicrophonePermission();
		return permission.granted;
	}

	const handleCapture = async () => {
		if (!cameraRef.current || isModeTransitioning) return;

		if (mode === "photo") {
			const picture = await cameraRef.current.takePictureAsync({
				quality: 0.8,
			});
			if (picture?.uri) onCapture(picture, "photo");
			return;
		}

		if (isRecording) {
			cameraRef.current.stopRecording();
			return;
		}

		const canRecord = await ensureMicrophonePermission();
		if (!canRecord) return;

		try {
			setIsRecording(true);
			const video = await cameraRef.current.recordAsync();
			if (video?.uri) onCapture(video, "video");
		} finally {
			setIsRecording(false);
		}
	};

	return (
		<CameraContext.Provider
			value={{
				cameraRef,
				mode,
				isRecording,
				isModeTransitioning,
				handleModeChange,
				handleCameraReady,
				handleCapture,
				cameraPermission,
				requestCameraPermission,
				microphonePermission,
				requestMicrophonePermission,
			}}
		>
			<View className="flex-1 bg-black">{children}</View>
		</CameraContext.Provider>
	);
}
