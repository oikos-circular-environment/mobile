import {
	CameraCaptureButton,
	CameraCaptureHint,
} from "./camera-capture-button";
import { CameraGeospatialOverlay } from "./camera-geospatial-overlay";
import { CameraModeSelector } from "./camera-mode-selector";
import { CameraPreview } from "./camera-preview";
import { CameraRoot } from "./camera-root";

export { useCameraContext } from "./context";

export const Camera = Object.assign(CameraRoot, {
	Preview: CameraPreview,
	GeospatialOverlay: CameraGeospatialOverlay,
	ModeSelector: CameraModeSelector,
	CaptureButton: CameraCaptureButton,
	CaptureHint: CameraCaptureHint,
});
