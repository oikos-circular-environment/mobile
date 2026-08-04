import { Pressable } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useServicesCarouselContext } from "./context";
import type { ServiceCarouselItem } from "./types";

interface ServicesCarouselStepProps {
	item: ServiceCarouselItem;
	index: number;
}

export function ServicesCarouselStep({
	item,
	index,
}: ServicesCarouselStepProps) {
	const { activeIndex, progress, goToIndex, scale } =
		useServicesCarouselContext();
	const isActive = index === activeIndex;

	const fillStyle = useAnimatedStyle(() => ({
		width: `${progress.value * 100}%`,
	}));

	return (
		<Pressable
			onPress={() => goToIndex(index)}
			accessibilityLabel={item.stepLabel}
			className="flex-1 overflow-hidden rounded-full bg-gray-200"
			style={{ height: 6 * scale }}
		>
			{isActive ? (
				<Animated.View
					style={[
						{ position: "absolute", left: 0, top: 0, bottom: 0 },
						fillStyle,
					]}
					className="bg-primary"
				/>
			) : null}
		</Pressable>
	);
}
