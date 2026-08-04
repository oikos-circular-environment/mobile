import {
	type CameraCapturedPicture,
	type CameraView,
	type FlashMode,
	useCameraPermissions,
	useMicrophonePermissions,
} from "expo-camera";
import {
	type PropsWithChildren,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { View } from "react-native";
import type {
	CameraCapturedVideo,
	ComplaintCaptureMode,
} from "@/libs/types/complaint";
import { CameraContext } from "./context";

type CameraProps = PropsWithChildren<{
	onCapture: (
		object: CameraCapturedPicture | CameraCapturedVideo,
		type: ComplaintCaptureMode,
	) => void;
	defaultMode?: ComplaintCaptureMode;
}>;

export function Camera({
	children,
	onCapture,
	defaultMode = "photo",
}: CameraProps) {
	const cameraRef = useRef<CameraView | null>(null);
	const modeTransitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);

	const [mode, setMode] = useState<ComplaintCaptureMode>(defaultMode);
	const [isRecording, setIsRecording] = useState(false);
	const [isCapturing, setIsCapturing] = useState(false);
	const [isModeTransitioning, setIsModeTransitioning] = useState(false);
	const [flash, setFlash] = useState<FlashMode>("off");
	const [zoom, setZoomRaw] = useState(0);

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

	const toggleFlash = () => {
		setFlash(current => (current === "off" ? "on" : "off"));
	};

	const setZoom = useCallback((value: number) => {
		setZoomRaw(Math.max(0, Math.min(1, value)));
	}, []);

	async function ensureMicrophonePermission() {
		if (microphonePermission?.granted) return true;
		const permission = await requestMicrophonePermission();
		return permission.granted;
	}

	const handleCapture = async () => {
		if (!cameraRef.current || isModeTransitioning) return;

		if (mode === "photo") {
			if (isCapturing) return;
			setIsCapturing(true);
			try {
				const picture = await cameraRef.current.takePictureAsync({
					quality: 0.8,
				});
				if (picture?.uri) onCapture(picture, "photo");
			} catch (err) {
				console.error("[Camera] takePictureAsync failed:", err);
			} finally {
				setIsCapturing(false);
			}
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
			if (video?.uri) {
				onCapture(video, "video");
			}
		} catch (err) {
			console.error("[Camera] recordAsync failed:", err);
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
				isCapturing,
				isModeTransitioning,
				flash,
				zoom,
				handleModeChange,
				handleCameraReady,
				handleCapture,
				toggleFlash,
				setZoom,
				cameraPermission,
				requestCameraPermission,
				microphonePermission,
				requestMicrophonePermission,
			}}
		>
			<View className="flex-1 bg-black">
				{children}
				{isModeTransitioning && (
					<View
						className="absolute inset-0"
						onStartShouldSetResponder={() => true}
					/>
				)}
			</View>
		</CameraContext.Provider>
	);
}
