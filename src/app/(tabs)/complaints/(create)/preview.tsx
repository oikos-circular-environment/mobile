import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Trash2 } from "lucide-react-native";
import { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ImagePreviewViewer, VideoPreviewPlayer } from "@/components/common";
import { colors } from "@/components/style/colors";
import { Text } from "@/components/ui/text";
import { useComplaintCreateContext } from "@/contexts/create-complaint-context";

export default function ComplaintPreviewScreen() {
	const { captureId } = useLocalSearchParams<{ captureId?: string }>();
	const { captures, deleteCapture } = useComplaintCreateContext();
	const insets = useSafeAreaInsets();
	const [confirmingDelete, setConfirmingDelete] = useState(false);

	const previewCapture = captures.find(capture => capture.id === captureId);
	const captureUri = previewCapture?.capture.object?.uri;

	const handleDeleteConfirm = () => {
		if (!captureId) return;
		deleteCapture(captureId);
		setConfirmingDelete(false);
		router.back();
	};

	return (
		<View className="flex-1 bg-black">
			{previewCapture && captureUri ? (
				previewCapture.capture.type === "photo" ? (
					<ImagePreviewViewer uri={captureUri} />
				) : (
					<VideoPreviewPlayer uri={captureUri} />
				)
			) : (
				<View className="flex-1 items-center justify-center">
					<Text className="text-white/50">
						Não foi possível carregar a captura.
					</Text>
				</View>
			)}

			<View
				className="absolute left-0 right-0 flex-row items-center justify-between px-4"
				style={{ top: insets.top + 8 }}
			>
				<TouchableOpacity
					className="rounded-xl bg-black/50 p-3"
					onPress={() => router.back()}
				>
					<ArrowLeft size={20} color={colors.white} strokeWidth={2.2} />
				</TouchableOpacity>

				{previewCapture && (
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
	);
}
