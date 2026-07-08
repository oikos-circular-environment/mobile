import { BlurView } from "expo-blur";
import { CameraView } from "expo-camera";
import { useEffect } from "react";
import { Button, StyleSheet, View } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withTiming,
} from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { useCameraContext } from "./context";

// onCameraReady fires before the native layer finishes rendering the new mode.
// Keeping the blur visible 350 ms longer covers the blue-tinted artifact frame.
const BLUR_LINGER_MS = 500;
const BLUR_FADE_MS = 220;

export function CameraPreview() {
	const {
		cameraRef,
		mode,
		flash,
		zoom,
		isModeTransitioning,
		handleCameraReady,
		cameraPermission,
		requestCameraPermission,
	} = useCameraContext();

	const blurOpacity = useSharedValue(0);

	useEffect(() => {
		if (isModeTransitioning) {
			blurOpacity.value = withTiming(1, { duration: 120 });
		} else {
			blurOpacity.value = withDelay(
				BLUR_LINGER_MS,
				withTiming(0, { duration: BLUR_FADE_MS }),
			);
		}
	}, [isModeTransitioning, blurOpacity]);

	const blurStyle = useAnimatedStyle(() => ({
		opacity: blurOpacity.value,
	}));

	if (!cameraPermission) {
		return <View className="absolute inset-0 z-50 bg-black" />;
	}

	if (!cameraPermission.granted) {
		return (
			<View className="absolute inset-0 z-50 items-center justify-center gap-3 bg-black px-6">
				<Text className="text-center text-white">
					Precisamos da permissão de câmera para continuar.
				</Text>
				<Button onPress={requestCameraPermission} title="Conceder permissão" />
			</View>
		);
	}

	return (
		<View style={{ flex: 1 }}>
			<CameraView
				key={mode}
				ref={cameraRef}
				style={{ flex: 1 }}
				mode={mode === "photo" ? "picture" : "video"}
				flash={flash}
				zoom={zoom}
				onCameraReady={handleCameraReady}
			/>
			<Animated.View
				style={[StyleSheet.absoluteFill, blurStyle]}
				pointerEvents="none"
			>
				<BlurView
					intensity={70}
					tint="dark"
					experimentalBlurMethod="dimezisBlurView"
					style={StyleSheet.absoluteFill}
				/>
			</Animated.View>
		</View>
	);
}
