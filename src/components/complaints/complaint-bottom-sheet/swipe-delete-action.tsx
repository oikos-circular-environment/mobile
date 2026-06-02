import { Trash2Icon } from "lucide-react-native";
import { TouchableOpacity } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { colors } from "@/components/style/colors";
import { Text } from "@/components/ui/text";

const SWIPE_ACTION_WIDTH = 72;

export function SwipeDeleteAction({
	translation,
	onDelete,
}: {
	translation: SharedValue<number>;
	onDelete: () => void;
}) {
	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: translation.value + SWIPE_ACTION_WIDTH }],
	}));
	return (
		<Animated.View
			style={[animatedStyle, { width: SWIPE_ACTION_WIDTH }]}
			className="overflow-hidden rounded-r-[10px]"
		>
			<TouchableOpacity
				activeOpacity={0.85}
				onPress={onDelete}
				className="flex-1 items-center justify-center gap-1 bg-red-500"
			>
				<Trash2Icon size={16} color={colors.white} strokeWidth={2} />
				<Text className="text-[10px] font-semibold text-white">Excluir</Text>
			</TouchableOpacity>
		</Animated.View>
	);
}
