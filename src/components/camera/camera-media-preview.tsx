import { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { MediaThumbnail, MediaViewer } from "@/components/medias-preview";
import { Text } from "@/components/ui/text";
import type { DraftAttachment } from "@/libs/types/complaint";

type CameraMediaPreviewProps = {
	attachments: DraftAttachment[];
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
	attachments,
	onDelete,
}: CameraMediaPreviewProps) {
	const [viewerOpen, setViewerOpen] = useState(false);

	const frontAttachment =
		attachments.length > 0 ? attachments[attachments.length - 1] : null;
	const stackAttachments = attachments.slice(-3);

	if (attachments.length === 0) {
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
					{stackAttachments.map((attachment, index) => {
						const layerIndex = index + (3 - stackAttachments.length);
						const layer = STACK_LAYERS[layerIndex] ?? STACK_LAYERS[2];

						return (
							<View
								key={attachment.id}
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
										mediaType={attachment.mediaType}
										uri={attachment.uri}
										fallbackLabel={
											attachment.mediaType === "video" ? "VIDEO" : "FOTO"
										}
										fileSizeBytes={attachment.fileSize}
									/>
								</View>
							</View>
						);
					})}
				</View>
			</TouchableOpacity>

			<MediaViewer
				visible={viewerOpen}
				attachment={frontAttachment}
				onClose={() => setViewerOpen(false)}
				onDelete={onDelete}
			/>
		</>
	);
}
