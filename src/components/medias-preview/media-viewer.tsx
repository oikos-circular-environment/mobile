import { ArrowLeft, Trash2 } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Modal, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/components/style/colors";
import { Text } from "@/components/ui/text";
import type { ComplaintCapture } from "@/libs/types/complaint";
import { ImagePreviewViewer } from "./image-preview-viewer";
import { VideoPreviewPlayer } from "./video-preview-player";

type MediaViewerProps = {
	visible: boolean;
	capture: ComplaintCapture | null;
	onClose: () => void;
	onDelete?: (id: string) => void;
};

export function MediaViewer({
	visible,
	capture,
	onClose,
	onDelete,
}: MediaViewerProps) {
	const [confirmingDelete, setConfirmingDelete] = useState(false);
	const insets = useSafeAreaInsets();

	useEffect(() => {
		if (!visible) setConfirmingDelete(false);
	}, [visible]);

	const captureUri = capture?.capture.object?.uri;
	const captureType = capture?.capture.type;

	const handleClose = () => {
		setConfirmingDelete(false);
		onClose();
	};

	const handleDeleteConfirm = () => {
		if (!capture || !onDelete) return;
		onDelete(capture.id);
		setConfirmingDelete(false);
		onClose();
	};

	return (
		<Modal
			visible={visible}
			animationType="fade"
			statusBarTranslucent
			onRequestClose={() => {
				if (confirmingDelete) {
					setConfirmingDelete(false);
				} else {
					handleClose();
				}
			}}
		>
			<View className="flex-1 bg-black">
				{captureType === "photo" && captureUri ? (
					<ImagePreviewViewer uri={captureUri} />
				) : captureType === "video" && captureUri ? (
					<VideoPreviewPlayer uri={captureUri} />
				) : (
					<View className="flex-1 items-center justify-center">
						<Text className="text-white/50">Mídia indisponível</Text>
					</View>
				)}

				<View
					className="absolute left-0 right-0 flex-row items-center justify-between px-4"
					style={{ top: insets.top + 8 }}
				>
					<TouchableOpacity
						className="rounded-xl bg-black/50 p-3"
						onPress={handleClose}
					>
						<ArrowLeft size={20} color={colors.white} strokeWidth={2.2} />
					</TouchableOpacity>

					{onDelete && (
						<TouchableOpacity
							className="rounded-xl bg-black/50 p-3"
							onPress={() => setConfirmingDelete(true)}
						>
							<Trash2 size={20} color={colors.white} strokeWidth={2.2} />
						</TouchableOpacity>
					)}
				</View>

				{confirmingDelete && (
					<View className="absolute inset-0 items-center justify-center bg-black/70 px-6">
						<View className="w-full gap-4 rounded-2xl bg-white p-6">
							<Text className="text-lg font-semibold text-gray-900">
								Deletar mídia
							</Text>
							<Text className="text-sm text-gray-500">
								Esta mídia será deletada permanentemente e não poderá ser
								recuperada.
							</Text>
							<View className="mt-2 flex-row gap-3">
								<TouchableOpacity
									className="flex-1 items-center rounded-xl border border-gray-200 py-3"
									onPress={() => setConfirmingDelete(false)}
								>
									<Text className="font-medium text-gray-700">Cancelar</Text>
								</TouchableOpacity>
								<TouchableOpacity
									className="flex-1 items-center rounded-xl bg-red-600 py-3"
									onPress={handleDeleteConfirm}
								>
									<Text className="font-medium text-white">Deletar</Text>
								</TouchableOpacity>
							</View>
						</View>
					</View>
				)}
			</View>
		</Modal>
	);
}
