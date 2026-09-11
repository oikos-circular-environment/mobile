import { X } from "lucide-react-native";
import { TouchableOpacity, View } from "react-native";
import { MediaThumbnail } from "@/components/medias-preview/media-thumbnail";
import { colors } from "@/components/style/colors";

type AttachmentThumbnailProps = {
	uri: string;
	mediaType: "photo" | "video";
	fileSizeBytes?: number;
	onRemove: () => void;
	onPress?: () => void;
};

export function AttachmentThumbnail({
	uri,
	mediaType,
	fileSizeBytes,
	onRemove,
	onPress,
}: AttachmentThumbnailProps) {
	const fallbackLabel = mediaType === "video" ? "VÍD" : "IMG";

	const thumbnail = (
		<MediaThumbnail
			mediaType={mediaType}
			uri={uri}
			fallbackLabel={fallbackLabel}
			fileSizeBytes={fileSizeBytes}
		/>
	);

	return (
		<View className="relative" style={{ width: 80, height: 80 }}>
			{onPress ? (
				<TouchableOpacity
					activeOpacity={0.85}
					onPress={onPress}
					className="flex-1 overflow-hidden rounded-xl"
				>
					{thumbnail}
				</TouchableOpacity>
			) : (
				<View className="flex-1 overflow-hidden rounded-xl">{thumbnail}</View>
			)}
			<TouchableOpacity
				className="absolute -right-1 -top-1 items-center justify-center rounded-full bg-red-500 p-0.5"
				onPress={onRemove}
			>
				<X size={12} color={colors.white} strokeWidth={2.5} />
			</TouchableOpacity>
		</View>
	);
}
