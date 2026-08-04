import { BlurView } from "expo-blur";
import { PauseIcon, PlayIcon } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useAnimatedReaction } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { colors } from "@/components/style/colors";
import { Text } from "@/components/ui/text";
import { useServicesCarouselContext } from "./context";

interface ServicesCarouselDebugOverlayProps {
	/** Liga/desliga o overlay manualmente — pensado só pra depuração da temporização. */
	isVisible: boolean;
}

export function ServicesCarouselDebugOverlay({
	isVisible,
}: ServicesCarouselDebugOverlayProps) {
	const { progress, isPaused, autoPlayIntervalMs, scale } =
		useServicesCarouselContext();
	const [remainingSeconds, setRemainingSeconds] = useState(
		autoPlayIntervalMs / 1000,
	);

	useAnimatedReaction(
		() => progress.value,
		current => {
			const remaining = Math.max(
				0,
				(1 - current) * (autoPlayIntervalMs / 1000),
			);
			scheduleOnRN(setRemainingSeconds, Math.round(remaining * 10) / 10);
		},
	);

	if (!isVisible) return null;

	const StateIcon = isPaused ? PauseIcon : PlayIcon;

	return (
		<View
			className="absolute right-3 top-3 flex-row items-center overflow-hidden rounded-lg border border-white/40"
			style={{
				gap: 4 * scale,
				paddingVertical: 4 * scale,
				paddingHorizontal: 6 * scale,
			}}
		>
			<BlurView
				intensity={30}
				tint="dark"
				style={StyleSheet.absoluteFill}
				blurMethod="dimezisBlurView"
			/>
			<StateIcon size={12 * scale} color={colors.white} />
			<Text
				style={{ fontSize: 11 * scale }}
				className="font-mono font-medium text-white"
			>
				{remainingSeconds.toFixed(1)}s
			</Text>
		</View>
	);
}
