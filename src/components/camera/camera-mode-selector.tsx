import type { StyleProp, ViewStyle } from "react-native";
import { TouchableOpacity, View } from "react-native";
import { Text } from "@/components/ui/text";
import type { ComplaintCaptureMode } from "@/libs/types/complaint";
import { useCameraContext } from "./context";

type CameraModeSelectorProps = {
	style?: StyleProp<ViewStyle>;
};

const OPTIONS: { label: string; value: ComplaintCaptureMode }[] = [
	{ label: "Vídeo", value: "video" },
	{ label: "Foto", value: "photo" },
];

export function CameraModeSelector({ style }: CameraModeSelectorProps) {
	const { mode, handleModeChange, isRecording, isModeTransitioning } =
		useCameraContext();

	return (
		<View className="absolute left-0 right-0 px-4" style={style}>
			<View className="flex-row rounded-2xl bg-white/90 p-1">
				{OPTIONS.map(({ label, value }) => (
					<TouchableOpacity
						key={value}
						className={`flex-1 items-center rounded-xl py-3 ${
							mode === value ? "bg-lime-900" : "bg-transparent"
						}`}
						onPress={() => handleModeChange(value)}
						disabled={isRecording || isModeTransitioning}
					>
						<Text
							className={`text-lg ${mode === value ? "text-white" : "text-zinc-500"}`}
						>
							{label}
						</Text>
					</TouchableOpacity>
				))}
			</View>
		</View>
	);
}
