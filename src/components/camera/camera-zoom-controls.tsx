import type { StyleProp, ViewStyle } from "react-native";
import { TouchableOpacity, View } from "react-native";
import { Text } from "@/components/ui/text";
import { useCameraContext } from "./context";

// expo-camera expõe zoom como 0-1 sem API de min/max zoom do device,
// portanto esses valores são aproximações para uma progressão razoável.
const ZOOM_PRESETS = [
	{ label: "0.5×", value: 0 },
	{ label: "1×", value: 0.03 },
	{ label: "2×", value: 0.15 },
	{ label: "3×", value: 0.35 },
] as const;

type CameraZoomControlsProps = {
	style?: StyleProp<ViewStyle>;
};

export function CameraZoomControls({ style }: CameraZoomControlsProps) {
	const { zoom, setZoom } = useCameraContext();

	const activePreset = ZOOM_PRESETS.reduce((prev, curr) =>
		Math.abs(curr.value - zoom) < Math.abs(prev.value - zoom) ? curr : prev,
	);

	return (
		<View className="absolute left-0 right-0 items-center" style={style}>
			<View className="flex-row gap-2">
				{ZOOM_PRESETS.map(preset => {
					const isActive = activePreset.label === preset.label;
					return (
						<TouchableOpacity
							key={preset.label}
							className={`min-w-12 items-center rounded-full px-3 py-1.5 ${
								isActive ? "bg-white" : "bg-black/40"
							}`}
							onPress={() => setZoom(preset.value)}
						>
							<Text
								className={`text-xs font-semibold ${
									isActive ? "text-zinc-900" : "text-white"
								}`}
							>
								{preset.label}
							</Text>
						</TouchableOpacity>
					);
				})}
			</View>
		</View>
	);
}
