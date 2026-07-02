import { useEffect, useRef, useState } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { useCameraContext } from "./context";

function formatDuration(totalSeconds: number): string {
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

type CameraRecordingTimerProps = {
	style?: StyleProp<ViewStyle>;
};

export function CameraRecordingTimer({ style }: CameraRecordingTimerProps) {
	const { isRecording } = useCameraContext();
	const [elapsed, setElapsed] = useState(0);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		if (isRecording) {
			setElapsed(0);
			intervalRef.current = setInterval(() => {
				setElapsed(s => s + 1);
			}, 1000);
		} else {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
			setElapsed(0);
		}

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, [isRecording]);

	if (!isRecording) return null;

	return (
		<View
			className="absolute left-0 right-0 items-center"
			style={style}
			pointerEvents="none"
		>
			<View className="flex-row items-center gap-2 rounded-xl bg-red-600 px-4 py-2">
				<View className="h-2 w-2 rounded-full bg-white" />
				<Text className="text-sm font-semibold text-white">
					{formatDuration(elapsed)}
				</Text>
			</View>
		</View>
	);
}
