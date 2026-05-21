import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { ArrowLeft, Trash2 } from "lucide-react-native";
import { useState } from "react";
import { Modal, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MediaThumbnail } from "@/components/common";
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

function VideoViewer({ uri }: { uri: string }) {
	const player = useVideoPlayer({ uri }, p => {
		p.play();
	});

	return (
		<VideoView
			player={player}
			style={{ flex: 1 }}
			contentFit="contain"
			allowsFullscreen={false}
		/>
	);
}

export function CameraMediaPreview({
	captures,
	onDelete,
}: CameraMediaPreviewProps) {
	const [viewerOpen, setViewerOpen] = useState(false);
	const [confirmingDelete, setConfirmingDelete] = useState(false);
	const insets = useSafeAreaInsets();

	const frontCapture =
		captures.length > 0 ? captures[captures.length - 1] : null;
	const stackCaptures = captures.slice(-3);

	const handleDeleteConfirm = () => {
		if (!frontCapture || !onDelete) return;
		onDelete(frontCapture.id);
		setConfirmingDelete(false);
		setViewerOpen(false);
	};

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

			<Modal
				visible={viewerOpen}
				animationType="fade"
				statusBarTranslucent
				onRequestClose={() => {
					if (confirmingDelete) {
						setConfirmingDelete(false);
					} else {
						setViewerOpen(false);
					}
				}}
			>
				<View className="flex-1 bg-black">
					{frontCapture?.capture.type === "photo" &&
					frontCapture.capture.object?.uri ? (
						<Image
							source={{ uri: frontCapture.capture.object.uri }}
							style={{ flex: 1 }}
							contentFit="contain"
						/>
					) : frontCapture?.capture.object?.uri ? (
						<VideoViewer uri={frontCapture.capture.object.uri} />
					) : (
						<View className="flex-1 items-center justify-center">
							<Text className="text-white/50">Mídia indisponível</Text>
						</View>
					)}

					{/* Top bar */}
					<View
						className="absolute left-0 right-0 flex-row items-center justify-between px-4"
						style={{ top: insets.top + 8 }}
					>
						<TouchableOpacity
							className="rounded-xl p-3"
							onPress={() => setViewerOpen(false)}
						>
							<ArrowLeft size={20} color="white" strokeWidth={2.2} />
						</TouchableOpacity>

						{onDelete && (
							<TouchableOpacity
								className="rounded-xl p-3 bg-red-500"
								onPress={() => setConfirmingDelete(true)}
							>
								<Trash2 size={20} color="white" strokeWidth={2.2} />
							</TouchableOpacity>
						)}
					</View>

					{/* Delete confirmation overlay */}
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
		</>
	);
}
