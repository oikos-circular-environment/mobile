import type { ComponentType } from "react";
import { useEffect } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withSequence,
	withTiming,
} from "react-native-reanimated";
import { colors } from "@/components/style/colors";
import { Text } from "@/components/ui/text";

interface FloatingGlassBadgeProps {
	icon: ComponentType<{ size: number; color: string }>;
	label: string;
	style?: StyleProp<ViewStyle>;
}

export function FloatingGlassBadge({
	icon: Icon,
	label,
	style,
}: FloatingGlassBadgeProps) {
	const translateY = useSharedValue(0);

	useEffect(() => {
		translateY.value = withRepeat(
			withSequence(
				withTiming(-6, { duration: 1400 }),
				withTiming(6, { duration: 1400 }),
			),
			-1,
			true,
		);
	}, [translateY]);

	const floatStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: translateY.value }],
	}));

	return (
		<Animated.View
			style={[style, floatStyle]}
			className="flex-row items-center gap-1.5 self-start rounded-full border border-white/40 bg-white/30 px-3 py-2 shadow-sm"
		>
			<Icon size={14} color={colors.gray[700]} />
			<Text size="xs" bold className="text-gray-700">
				{label}
			</Text>
		</Animated.View>
	);
}
