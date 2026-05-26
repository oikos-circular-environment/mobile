import { useEffect } from "react";
import { TouchableOpacity, View } from "react-native";
import Animated, {
	cancelAnimation,
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { colors } from "@/components/style/colors";
import { useCameraContext } from "./context";

const SPINNER_SIZE = 74;
const STROKE = 3;
const RADIUS = (SPINNER_SIZE - STROKE) / 2;
const CENTER = SPINNER_SIZE / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const ARC = CIRCUMFERENCE * 0.8;

function ArcSpinner() {
	const rotation = useSharedValue(0);

	useEffect(() => {
		rotation.value = withRepeat(
			withTiming(360, { duration: 900, easing: Easing.linear }),
			-1,
			false,
		);
		return () => cancelAnimation(rotation);
	}, [rotation]);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ rotate: `${rotation.value}deg` }],
	}));

	return (
		<Animated.View style={animatedStyle}>
			<Svg
				width={SPINNER_SIZE}
				height={SPINNER_SIZE}
				viewBox={`0 0 ${SPINNER_SIZE} ${SPINNER_SIZE}`}
			>
				<Defs>
					<LinearGradient id="arcGrad" x1="1" y1="0" x2="0" y2="1">
						<Stop offset="0%" stopColor={colors.lime[800]} stopOpacity={1} />
						<Stop offset="100%" stopColor={colors.lime[800]} stopOpacity={0.08} />
					</LinearGradient>
				</Defs>
				<Circle
					cx={CENTER}
					cy={CENTER}
					r={RADIUS}
					stroke="url(#arcGrad)"
					strokeWidth={STROKE}
					strokeDasharray={`${ARC} ${CIRCUMFERENCE - ARC}`}
					strokeLinecap="round"
					fill="none"
				/>
			</Svg>
		</Animated.View>
	);
}

export function CameraCaptureButton() {
	const { mode, isRecording, isCapturing, isModeTransitioning, handleCapture } =
		useCameraContext();

	const isLoading = isCapturing || isModeTransitioning;

	return (
		<TouchableOpacity
			className={`size-22 items-center justify-center rounded-full border-4 border-white ${
				mode === "video" && isRecording ? "bg-red-600" : "bg-white"
			}`}
			onPress={handleCapture}
			disabled={isLoading}
		>
			{isLoading ? (
				<ArcSpinner />
			) : (
				<View className="h-18 w-18 rounded-full border-2 border-white/50" />
			)}
		</TouchableOpacity>
	);
}
