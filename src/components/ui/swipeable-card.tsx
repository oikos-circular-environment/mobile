import { TrashIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";

const DELETE_WIDTH = 80;
const SPRING = { damping: 20, stiffness: 200 } as const;

interface SwipeableCardProps {
	onDelete: () => void;
	onPress: () => void;
	children: ReactNode;
}

export function SwipeableCard({
	onDelete,
	onPress,
	children,
}: SwipeableCardProps) {
	const translateX = useSharedValue(0);

	const panGesture = Gesture.Pan()
		.activeOffsetX([-10, 10])
		.failOffsetY([-5, 5])
		.onUpdate(e => {
			translateX.value = Math.max(-DELETE_WIDTH, Math.min(0, e.translationX));
		})
		.onEnd(e => {
			translateX.value = withSpring(
				e.translationX < -(DELETE_WIDTH / 2) ? -DELETE_WIDTH : 0,
				SPRING,
			);
		});

	const cardStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: translateX.value }],
	}));

	const deleteOpacity = useAnimatedStyle(() => ({
		opacity: Math.min(1, -translateX.value / DELETE_WIDTH),
	}));

	const handlePress = () => {
		if (translateX.value < -5) {
			translateX.value = withSpring(0, SPRING);
			return;
		}
		onPress();
	};

	const handleDelete = () => {
		translateX.value = withSpring(0, SPRING);
		onDelete();
	};

	return (
		<View className="overflow-hidden rounded-xl">
			<Animated.View
				style={[
					deleteOpacity,
					{
						position: "absolute",
						right: 0,
						top: 0,
						bottom: 0,
						width: DELETE_WIDTH,
					},
				]}
				className="bg-red-500 items-center justify-center"
			>
				<Pressable
					className="flex-1 w-full items-center justify-center"
					onPress={handleDelete}
				>
					<TrashIcon color="white" size={20} />
				</Pressable>
			</Animated.View>

			<GestureDetector gesture={panGesture}>
				<Animated.View style={cardStyle} className="bg-card">
					<Pressable onPress={handlePress}>{children}</Pressable>
				</Animated.View>
			</GestureDetector>
		</View>
	);
}
