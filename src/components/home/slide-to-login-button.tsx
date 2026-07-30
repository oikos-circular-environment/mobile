import { ArrowRightIcon } from "lucide-react-native";
import { useState } from "react";
import { type LayoutChangeEvent, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from "react-native-reanimated";
import { colors } from "@/components/style/colors";
import { Text } from "@/components/ui/text";

const THUMB_SIZE = 52;
const TRACK_PADDING = 4;
const COMPLETE_THRESHOLD = 0.72;
const SPRING = { damping: 18, stiffness: 200 } as const;

export function shouldCompleteSlide(
	translateX: number,
	maxTranslate: number,
	threshold: number = COMPLETE_THRESHOLD,
) {
	if (maxTranslate <= 0) return false;
	return translateX >= maxTranslate * threshold;
}

interface SlideToLoginButtonProps {
	label?: string;
	onComplete: () => void;
}

export function SlideToLoginButton({
	label = "Iniciar sessão",
	onComplete,
}: SlideToLoginButtonProps) {
	const [trackWidth, setTrackWidth] = useState(0);
	const translateX = useSharedValue(0);
	const isCompleting = useSharedValue(false);

	const maxTranslate = Math.max(0, trackWidth - THUMB_SIZE - TRACK_PADDING * 2);

	const handleLayout = (e: LayoutChangeEvent) => {
		setTrackWidth(e.nativeEvent.layout.width);
	};

	const panGesture = Gesture.Pan()
		.onUpdate(e => {
			if (isCompleting.value) return;
			translateX.value = Math.max(0, Math.min(maxTranslate, e.translationX));
		})
		.onEnd(() => {
			if (isCompleting.value) return;
			if (shouldCompleteSlide(translateX.value, maxTranslate)) {
				isCompleting.value = true;
				translateX.value = withTiming(maxTranslate, { duration: 180 });
				runOnJS(onComplete)();
			} else {
				translateX.value = withSpring(0, SPRING);
			}
		});

	const thumbStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: translateX.value }],
	}));

	const labelStyle = useAnimatedStyle(() => ({
		opacity: maxTranslate > 0 ? 1 - translateX.value / maxTranslate : 1,
	}));

	return (
		<View
			onLayout={handleLayout}
			className="h-16 justify-center overflow-hidden rounded-full border border-white/40 bg-white/25 shadow-sm"
		>
			<Animated.View
				style={labelStyle}
				className="absolute inset-0 items-center justify-center"
			>
				<Text bold className="text-gray-800">
					{label}
				</Text>
			</Animated.View>

			<GestureDetector gesture={panGesture}>
				<Animated.View
					style={[
						thumbStyle,
						{
							position: "absolute",
							left: TRACK_PADDING,
							top: TRACK_PADDING,
							width: THUMB_SIZE,
							height: THUMB_SIZE,
						},
					]}
					className="items-center justify-center rounded-full bg-white shadow-sm"
				>
					<ArrowRightIcon size={20} color={colors.lime[800]} />
				</Animated.View>
			</GestureDetector>
		</View>
	);
}
