import type { CameraCapturedPicture } from "expo-camera";
import * as Crypto from "expo-crypto";
import { router } from "expo-router";
import { ArrowLeft, ArrowRight } from "lucide-react-native";
import { TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Camera } from "@/components/camera";
import { colors } from "@/components/style/colors";
import { useComplaintCreation } from "@/contexts/complaint-creation-context";
import { getFileSize } from "@/libs/media-validation";
import type {
	CameraCapturedVideo,
	ComplaintCaptureMode,
	DraftAttachment,
} from "@/libs/types/complaint";
import { useRouteInteractive } from "@/libs/use-route-interactive";

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
			<Camera.Preview />

			<View
				className="absolute left-0 right-0 flex-row px-5"
				style={{ top: 16 }}
			>
				<TouchableOpacity
					className="rounded-xl p-3"
					onPress={() => router.back()}
				>
					<ArrowLeft size={20} color={colors.white} strokeWidth={2.2} />
				</TouchableOpacity>
			</View>
			<Camera.RecordingTimer style={{ top: 16 }} />
			<Camera.FlashControl style={{ top: 16 }} />
			<Camera.ZoomControls style={{ bottom: insets.bottom + 180 }} />
			<Camera.ModeSelector style={{ bottom: insets.bottom + 120 }} />

			<View
				className="absolute left-0 right-0 px-4"
				style={{ bottom: insets.bottom + 10 }}
			>
				<View className="flex-row items-end justify-between">
					<Camera.MediaPreview
						attachments={cameraAttachments}
						onDelete={removeAttachment}
					/>

					<Camera.CaptureButton />

					<TouchableOpacity
						className={`h-20 w-20 items-center justify-center rounded-xl ${
							cameraAttachments.length > 0 ? "bg-white" : "bg-white/40"
						}`}
						onPress={handleAdvance}
						disabled={cameraAttachments.length === 0}
					>
						<ArrowRight size={34} color={colors.lime[800]} strokeWidth={2.2} />
					</TouchableOpacity>
				</View>
			</View>
		</Camera>
	);
}
