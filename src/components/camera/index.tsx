import {
	CameraCaptureButton,
	CameraCaptureHint,
} from "./camera-capture-button";
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
	GeospatialOverlay: CameraGeospatialOverlay,
	ModeSelector: CameraModeSelector,
	CaptureButton: CameraCaptureButton,
	CaptureHint: CameraCaptureHint,
	MediaPreview: CameraMediaPreview,
	RecordingTimer: CameraRecordingTimer,
	ZoomControls: CameraZoomControls,
});
