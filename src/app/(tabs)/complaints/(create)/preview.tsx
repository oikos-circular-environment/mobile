import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Trash2 } from "lucide-react-native";
import { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
	ImagePreviewViewer,
	VideoPreviewPlayer,
} from "@/components/medias-preview";
import { colors } from "@/components/style/colors";
import { Text } from "@/components/ui/text";
import { useComplaintCreation } from "@/contexts/complaint-creation-context";
import { useRouteInteractive } from "@/hooks/use-route-interactive";

export default function ComplaintPreviewScreen() {
	useRouteInteractive();
	const { id } = useLocalSearchParams<{ id: string }>();
	const { attachments, removeAttachment } = useComplaintCreation();
	const insets = useSafeAreaInsets();
	const [confirmingDelete, setConfirmingDelete] = useState(false);

	const attachment = attachments.find(a => a.id === id);
	const uri = attachment?.uri ?? attachment?.url;
	const mediaType = attachment?.mediaType;
	const canDelete = !!attachment;

	const handleDeleteConfirm = () => {
		if (!id) return;
		removeAttachment(id);
		setConfirmingDelete(false);
		router.back();
	};

	return (
		<View className="flex-1 bg-black">
			{uri && mediaType === "photo" ? (
				<ImagePreviewViewer uri={uri} />
			) : uri && mediaType === "video" ? (
				<VideoPreviewPlayer uri={uri} />
			) : (
				<View className="flex-1 items-center justify-center">
					<Text className="text-white/50">
						Não foi possível carregar a mídia.
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

				{canDelete && (
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
