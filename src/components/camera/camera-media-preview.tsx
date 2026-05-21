import { Image } from "expo-image";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import type { ComplaintCaptureMode } from "@/libs/types/complaint";

type CameraMediaPreviewProps = {
	type?: ComplaintCaptureMode;
	uri?: string | null;
	hasMore?: boolean;
};

export function CameraMediaPreview({
	type,
	uri,
	hasMore = false,
}: CameraMediaPreviewProps) {
	const hasCapture = type != null;

	if (!hasCapture) {
		return (
			<View className="h-20 w-20 items-center justify-center overflow-hidden rounded-xl bg-zinc-700/80">
				<Text className="text-[10px] text-white/70">Sem mídia</Text>
			</View>
		);
	}

	return (
		<View className="h-20 w-20 overflow-hidden rounded-xl">
			{hasMore && (
				<View className="absolute -left-1 -top-1 h-full w-full rounded-xl bg-zinc-700/70" />
			)}
			{type === "photo" && uri ? (
				<Image source={{ uri }} contentFit="cover" style={{ flex: 1 }} />
			) : (
				<View className="flex-1 items-center justify-center bg-zinc-800">
					<Text className="text-[10px] font-semibold text-white">VIDEO</Text>
				</View>
			)}
		</View>
	);
}
