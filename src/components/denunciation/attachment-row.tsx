import type * as ImagePicker from "expo-image-picker";
import { ImageIcon, X } from "lucide-react-native";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { MediaThumbnail } from "@/components/medias-preview/media-thumbnail";
import { colors } from "@/components/style/colors";
import { Pressable } from "@/components/ui/pressable";
import { Spinner } from "@/components/ui/spinner";
import type { DenunciationAttachment } from "@/libs/types/denunciation";

export function AttachmentPickerRow({
	assets,
	onPick,
	onRemove,
	isPicking,
}: {
	assets: ImagePicker.ImagePickerAsset[];
	onPick: () => void;
	onRemove: (uri: string) => void;
	isPicking: boolean;
}) {
	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerClassName="gap-2 my-2"
			nestedScrollEnabled
			keyboardShouldPersistTaps="always"
		>
			<Pressable
				onPress={onPick}
				disabled={isPicking}
				className="items-center justify-center rounded-xl border border-gray-200 bg-gray-50"
				style={{ width: 80, height: 80 }}
			>
				{isPicking ? (
					<Spinner color={colors.gray[400]} />
				) : (
					<ImageIcon size={24} color={colors.gray[400]} strokeWidth={1.5} />
				)}
			</Pressable>

			{assets.map(asset => (
				<View
					key={asset.uri}
					className="relative"
					style={{ width: 80, height: 80 }}
				>
					<View className="flex-1 overflow-hidden rounded-xl">
						<MediaThumbnail
							mediaType={asset.type === "video" ? "video" : "photo"}
							uri={asset.uri}
							fallbackLabel={asset.type === "video" ? "VÍD" : "IMG"}
							fileSizeBytes={asset.fileSize}
						/>
					</View>
					<TouchableOpacity
						className="absolute -right-1 -top-1 items-center justify-center rounded-full bg-red-500 p-0.5"
						onPress={() => onRemove(asset.uri)}
					>
						<X size={12} color={colors.white} strokeWidth={2.5} />
					</TouchableOpacity>
				</View>
			))}
		</ScrollView>
	);
}

export function AttachmentPreviewList({
	attachments,
}: {
	attachments: DenunciationAttachment[];
}) {
	if (attachments.length === 0) return null;
	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerClassName="gap-2 my-2"
			nestedScrollEnabled
			keyboardShouldPersistTaps="always"
		>
			{attachments.map(attachment => (
				<View
					key={attachment.id}
					className="relative"
					style={{ width: 80, height: 80 }}
				>
					<View className="flex-1 overflow-hidden rounded-xl">
						<MediaThumbnail
							mediaType={attachment.type === "VIDEO" ? "video" : "photo"}
							uri={attachment.url}
							fallbackLabel={attachment.type === "VIDEO" ? "VÍD" : "IMG"}
						/>
					</View>
				</View>
			))}
		</ScrollView>
	);
}
