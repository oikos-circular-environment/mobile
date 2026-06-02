import { ArrowLeftIcon } from "lucide-react-native";
import { Modal, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ImagePreviewViewer } from "@/components/medias-preview/image-preview-viewer";
import { VideoPreviewPlayer } from "@/components/medias-preview/video-preview-player";
import { colors } from "@/components/style/colors";
import type { Attachment } from "./utils";

export type AttachmentPreviewProps = {
	visible: boolean;
	attachment: Attachment | null;
	onClose: () => void;
};

export function AttachmentPreview({
	visible,
	attachment,
	onClose,
}: AttachmentPreviewProps) {
	const insets = useSafeAreaInsets();
	return (
		<Modal
			visible={visible}
			animationType="fade"
			statusBarTranslucent
			onRequestClose={onClose}
		>
			<View className="flex-1 bg-black">
				{attachment?.type === "PHOTO" ? (
					<ImagePreviewViewer uri={attachment.url} />
				) : attachment?.type === "VIDEO" ? (
					<VideoPreviewPlayer uri={attachment.url} />
				) : null}
				<TouchableOpacity
					className="absolute left-4 rounded-xl bg-black/50 p-3"
					style={{ top: insets.top + 8 }}
					onPress={onClose}
				>
					<ArrowLeftIcon size={20} color={colors.white} strokeWidth={2.2} />
				</TouchableOpacity>
			</View>
		</Modal>
	);
}
