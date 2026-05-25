import { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { MediaThumbnail, MediaViewer } from "@/components/common";
import { Text } from "@/components/ui/text";
import type { ComplaintCapture } from "@/libs/types/complaint";

type CameraMediaPreviewProps = {
	captures: ComplaintCapture[];
	onDelete?: (id: string) => void;
};

const CARD_SIZE = 80;
const PEEK = 8;
const CONTAINER_WIDTH = CARD_SIZE + PEEK * 2;

const STACK_LAYERS = [
	{ scale: 0.9, translateX: PEEK * 2, opacity: 0.5 },
	{ scale: 0.95, translateX: PEEK, opacity: 0.75 },
	{ scale: 1.0, translateX: 0, opacity: 1.0 },
] as const;

export function CameraMediaPreview({
	captures,
	onDelete,
}: CameraMediaPreviewProps) {
	const [viewerOpen, setViewerOpen] = useState(false);

	const frontCapture =
		captures.length > 0 ? captures[captures.length - 1] : null;
	const stackCaptures = captures.slice(-3);

	if (captures.length === 0) {
		return (
			<View
				style={{ width: CONTAINER_WIDTH, height: CARD_SIZE }}
				className="items-start justify-center"
			>
				<View className="h-20 w-20 items-center justify-center overflow-hidden rounded-xl bg-zinc-700/80">
					<Text className="text-[10px] text-white/70">Sem mídia</Text>
				</View>
			</View>
		);
	}

	return (
		<>
			<TouchableOpacity
				onPress={() => setViewerOpen(true)}
				activeOpacity={0.85}
			>
				<View style={{ width: CONTAINER_WIDTH, height: CARD_SIZE }}>
					{stackCaptures.map((capture, index) => {
						const layerIndex = index + (3 - stackCaptures.length);
						const layer = STACK_LAYERS[layerIndex] ?? STACK_LAYERS[2];

						return (
							<View
								key={capture.id}
								style={{
									position: "absolute",
									top: 0,
									left: 0,
									width: CARD_SIZE,
									height: CARD_SIZE,
									transform: [
										{ scale: layer.scale },
										{ translateX: layer.translateX },
									],
									opacity: layer.opacity,
								}}
							>
								<View className="flex-1 overflow-hidden rounded-xl border border-white/10">
									<MediaThumbnail
										mediaType={capture.capture.type}
										uri={capture.capture.object?.uri}
										fallbackLabel={
											capture.capture.type === "video" ? "VIDEO" : "FOTO"
										}
									/>
								</View>
							</View>
						);
					})}
				</View>
			</TouchableOpacity>

			<MediaViewer
				visible={viewerOpen}
				capture={frontCapture}
				onClose={() => setViewerOpen(false)}
				onDelete={onDelete}
			/>
		</>
	);
}
