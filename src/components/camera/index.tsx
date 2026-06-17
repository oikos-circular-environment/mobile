import { CameraCaptureButton } from "./camera-capture-button";
import { CameraFlashControl } from "./camera-flash-control";
import { CameraGeospatialOverlay } from "./camera-geospatial-overlay";
import { CameraMediaPreview } from "./camera-media-preview";
import { CameraModeSelector } from "./camera-mode-selector";
import { CameraPreview } from "./camera-preview";
import { CameraRecordingTimer } from "./camera-recording-timer";
import { CameraRoot } from "./camera-root";
import { CameraZoomControls } from "./camera-zoom-controls";

export { useCameraContext } from "./context";

export const Camera = Object.assign(CameraRoot, {
	Preview: CameraPreview,
	FlashControl: CameraFlashControl,
	GeospatialOverlay: CameraGeospatialOverlay,
	ModeSelector: CameraModeSelector,
	CaptureButton: CameraCaptureButton,
	MediaPreview: CameraMediaPreview,
	RecordingTimer: CameraRecordingTimer,
	ZoomControls: CameraZoomControls,
});
