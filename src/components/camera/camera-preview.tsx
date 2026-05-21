import { BlurView } from "expo-blur";
import { CameraView } from "expo-camera";
import { Button, View } from "react-native";
import { Text } from "@/components/ui/text";
import { useCameraContext } from "./context";

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

	if (!cameraPermission) {
		return <View className="flex-1 bg-black" />;
	}

	if (!cameraPermission.granted) {
		return (
			<View className="flex-1 items-center justify-center gap-3 bg-black px-6">
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
				ref={cameraRef}
				style={{ flex: 1 }}
				mode={mode === "photo" ? "picture" : "video"}
				flash={flash}
				zoom={zoom}
				onCameraReady={handleCameraReady}
			/>
			{isModeTransitioning && (
				<BlurView
					intensity={70}
					tint="dark"
					experimentalBlurMethod="dimezisBlurView"
					style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
				/>
			)}
		</View>
	);
}
