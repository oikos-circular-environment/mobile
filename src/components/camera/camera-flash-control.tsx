import { ZapIcon, ZapOffIcon } from "lucide-react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { TouchableOpacity, View } from "react-native";
import { colors } from "@/components/style/colors";
import { useCameraContext } from "./context";

type CameraFlashControlProps = {
	style?: StyleProp<ViewStyle>;
};

export function CameraFlashControl({ style }: CameraFlashControlProps) {
	const { flash, toggleFlash } = useCameraContext();

	const FlashIcon = flash === "on" ? ZapIcon : ZapOffIcon;

	return (
		<View className="absolute right-5" style={style}>
			<TouchableOpacity
				className="rounded-xl bg-white/90 p-3"
				onPress={toggleFlash}
			>
				<FlashIcon
					size={20}
					color={flash === "on" ? colors.lime[800] : colors.gray[600]}
					strokeWidth={2.2}
				/>
			</TouchableOpacity>
		</View>
	);
}
