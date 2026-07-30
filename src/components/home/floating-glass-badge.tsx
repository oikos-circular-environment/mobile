import type { ComponentType } from "react";
import { useEffect, useState } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, {
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withSequence,
	withTiming,
} from "react-native-reanimated";
import { colors } from "@/components/style/colors";
import { Text } from "@/components/ui/text";

export interface FloatingGlassBadgeItem {
	icon: ComponentType<{ size: number; color: string }>;
	label: string;
}

interface FloatingGlassBadgeProps {
	items: FloatingGlassBadgeItem[];
	/** Tempo em que cada item fica visível antes de trocar, em ms. */
	intervalMs?: number;
	/** Duração do fade de entrada/saída, em ms. */
	fadeDurationMs?: number;
	style?: StyleProp<ViewStyle>;
}

export function FloatingGlassBadge({
	items,
	intervalMs = 2600,
	fadeDurationMs = 260,
	style,
}: FloatingGlassBadgeProps) {
	const translateY = useSharedValue(0);
	const contentOpacity = useSharedValue(1);
	const [activeIndex, setActiveIndex] = useState(0);

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

	useEffect(() => {
		if (items.length <= 1) return;

		const advance = () => {
			setActiveIndex(current => (current + 1) % items.length);
			contentOpacity.value = withTiming(1, { duration: fadeDurationMs });
		};

		const timer = setInterval(() => {
			contentOpacity.value = withTiming(
				0,
				{ duration: fadeDurationMs },
				finished => {
					if (finished) {
						runOnJS(advance)();
					}
				},
			);
		}, intervalMs);

		return () => clearInterval(timer);
	}, [items.length, intervalMs, fadeDurationMs, contentOpacity]);

	const floatStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: translateY.value }],
	}));

	const fadeStyle = useAnimatedStyle(() => ({
		opacity: contentOpacity.value,
	}));

	const activeItem = items[activeIndex];
	const Icon = activeItem?.icon;

	return (
		<Animated.View
			style={[style, floatStyle]}
			className="flex-row items-center gap-1.5 self-start rounded-full border border-white/40 bg-white/30 px-3 py-2 shadow-sm"
		>
			<Animated.View
				style={fadeStyle}
				className="flex-row items-center gap-1.5"
			>
				{Icon ? <Icon size={14} color={colors.gray[700]} /> : null}
				<Text size="xs" bold className="text-gray-700">
					{activeItem?.label}
				</Text>
			</Animated.View>
		</Animated.View>
	);
}
