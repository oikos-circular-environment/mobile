import { TouchableOpacity, View } from "react-native";
import { Text } from "@/components/ui/text";
import { useCameraContext } from "./context";

export function CameraCaptureButton() {
	const { mode, isRecording, isCapturing, isModeTransitioning, handleCapture } =
		useCameraContext();

	const hint =
		mode === "photo"
			? "Toque para capturar foto"
			: isModeTransitioning
				? "Alternando modo"
				: isRecording
					? "Gravando vídeo"
					: "Toque para iniciar vídeo";

	return (
		<View className="items-center gap-2">
			<TouchableOpacity
				className={`size-22 items-center justify-center rounded-full border-4 border-white ${
					mode === "video" && isRecording ? "bg-red-600" : "bg-white"
				}`}
				onPress={handleCapture}
				disabled={isModeTransitioning || isCapturing}
			>
				<View className="h-18 w-18 rounded-full border-2 border-white/50" />
			</TouchableOpacity>
			<Text className="text-xs text-white/85">{hint}</Text>
		</View>
	);
}
