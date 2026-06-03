import { ZapIcon, ZapOffIcon } from "lucide-react-native";
import { TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/components/style/colors";
import { useCameraContext } from "./context";

type CameraFlashControlProps = {
	topOffset?: number;
};

export function CameraFlashControl({ topOffset = 16 }: CameraFlashControlProps) {
	const { flash, toggleFlash } = useCameraContext();
	const insets = useSafeAreaInsets();

	const FlashIcon = flash === "on" ? ZapIcon : ZapOffIcon;

	return (
		<View
			className="absolute right-5"
			style={{ top: insets.top + topOffset }}
		>
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
