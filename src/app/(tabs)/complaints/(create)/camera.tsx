import type { CameraCapturedPicture } from "expo-camera";
import * as Crypto from "expo-crypto";
import { type ErrorBoundaryProps, router } from "expo-router";
import { ArrowLeft, ArrowRight } from "lucide-react-native";
import { TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
	Camera,
	CameraCaptureButton,
	CameraFlashControl,
	CameraMediaPreview,
	CameraModeSelector,
	CameraPreview,
	CameraRecordingTimer,
	CameraZoomControls,
} from "@/components/camera";
import { ErrorFallback } from "@/components/error-fallback";
import { colors } from "@/components/style/colors";
import { useComplaintCreation } from "@/contexts/complaint-creation-context";
import { useRouteInteractive } from "@/hooks/use-route-interactive";
import { getFileSize } from "@/libs/media/validation";
import { useRecordScreenError } from "@/libs/moderation/use-record-screen-error";
import type {
	CameraCapturedVideo,
	ComplaintCaptureMode,
	DraftAttachment,
} from "@/libs/types/complaint";

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
	useRecordScreenError(error);

	return (
		<ErrorFallback
			title="A câmera falhou"
			message="Não foi possível continuar com a câmera. Tente novamente."
			onRetry={retry}
		/>
	);
}

export default function ComplaintCameraScreen() {
	useRouteInteractive();
	const { attachments, addAttachment, removeAttachment } =
		useComplaintCreation();
	const insets = useSafeAreaInsets();

	const cameraAttachments = attachments.filter(a => a.source === "camera");

	const handleCapture = async (
		captureObject: CameraCapturedPicture | CameraCapturedVideo,
		captureType: ComplaintCaptureMode,
	) => {
		const uri = captureObject?.uri;
		if (!uri) return;

		const fileSize = getFileSize(uri);
		const attachment: DraftAttachment = {
			id: Crypto.randomUUID(),
			source: "camera",
			mediaType: captureType,
			uri,
			fileSize,
		};
		addAttachment(attachment);
	};

	const handleAdvance = () => {
		if (cameraAttachments.length === 0) return;
		router.back();
	};

	return (
		<Camera onCapture={handleCapture}>
			<CameraPreview />

			<View
				className="absolute left-0 right-0 flex-row px-5"
				style={{ paddingTop: insets.top + 16 }}
			>
				<TouchableOpacity
					className="rounded-xl p-3"
					onPress={() => router.back()}
				>
					<ArrowLeft size={20} color={colors.white} strokeWidth={2.2} />
				</TouchableOpacity>
			</View>
			<CameraRecordingTimer style={{ paddingTop: insets.top + 16 }} />
			<CameraFlashControl style={{ paddingTop: insets.top + 16 }} />
			<CameraZoomControls style={{ bottom: insets.bottom + 180 }} />
			<CameraModeSelector style={{ bottom: insets.bottom + 120 }} />

			<View
				className="absolute left-0 right-0 px-4"
				style={{ bottom: insets.bottom + 10 }}
			>
				<View className="flex-row items-end justify-between">
					<CameraMediaPreview
						attachments={cameraAttachments}
						onDelete={removeAttachment}
					/>

					<CameraCaptureButton />

					<TouchableOpacity
						className={`h-20 w-20 items-center justify-center rounded-xl ${
							cameraAttachments.length > 0 ? "bg-white" : "bg-white/40"
						}`}
						onPress={handleAdvance}
						disabled={cameraAttachments.length === 0}
					>
						<ArrowRight size={34} color={colors.black} strokeWidth={2.2} />
					</TouchableOpacity>
				</View>
			</View>
		</Camera>
	);
}
