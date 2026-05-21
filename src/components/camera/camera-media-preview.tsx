import { X } from "lucide-react-native";
import { TouchableOpacity, View } from "react-native";
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

// Índice 0 = fundo da pilha (mais à direita), índice 2 = frente (mais à esquerda)
const STACK_LAYERS = [
	{ scale: 0.9, translateX: PEEK * 2, opacity: 0.5 },
	{ scale: 0.95, translateX: PEEK, opacity: 0.75 },
	{ scale: 1.0, translateX: 0, opacity: 1.0 },
] as const;

export function CameraMediaPreview({
	captures,
	onDelete,
}: CameraMediaPreviewProps) {
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

	// Últimas 3 capturas; índice menor = mais ao fundo do stack (mais à direita)
	const stackCaptures = captures.slice(-3);

	return (
		<View style={{ width: CONTAINER_WIDTH, height: CARD_SIZE }}>
			{stackCaptures.map((capture, index) => {
				// Alinha ao STACK_LAYERS independente de quantos cards há (1, 2 ou 3)
				const layerIndex = index + (3 - stackCaptures.length);
				const layer = STACK_LAYERS[layerIndex] ?? STACK_LAYERS[2];
				const isFront = index === stackCaptures.length - 1;

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

						{isFront && onDelete && (
							<TouchableOpacity
								className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5"
								onPress={() => onDelete(capture.id)}
								hitSlop={8}
							>
								<X size={10} color="white" strokeWidth={2.5} />
							</TouchableOpacity>
						)}
					</View>
				);
			})}
		</View>
	);
}
