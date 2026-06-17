import { PencilIcon } from "lucide-react-native";
import { TouchableOpacity } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { colors } from "@/components/style/colors";
import { Text } from "@/components/ui/text";

const SWIPE_ACTION_WIDTH = 72;

export function SwipeEditAction({
	translation,
	onEdit,
}: {
	translation: SharedValue<number>;
	onEdit: () => void;
}) {
	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: translation.value - SWIPE_ACTION_WIDTH }],
	}));
	return (
		<Animated.View
			style={[animatedStyle, { width: SWIPE_ACTION_WIDTH }]}
			className="overflow-hidden rounded-l-[10px]"
		>
			<TouchableOpacity
				activeOpacity={0.85}
				onPress={onEdit}
				className="flex-1 items-center justify-center gap-1 bg-lime-700"
			>
				<PencilIcon size={16} color={colors.white} strokeWidth={2} />
				<Text className="text-[10px] font-semibold text-white">Editar</Text>
			</TouchableOpacity>
		</Animated.View>
	);
}
