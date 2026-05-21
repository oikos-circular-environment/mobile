import { CameraView } from "expo-camera";
import { Button, View } from "react-native";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { useCameraContext } from "./context";

export function CameraPreview() {
	const {
		cameraRef,
		mode,
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
		<>
			<CameraView
				ref={cameraRef}
				style={{ flex: 1 }}
				mode={mode === "photo" ? "picture" : "video"}
				onCameraReady={handleCameraReady}
			/>
			{isModeTransitioning && (
				<View className="absolute inset-0 items-center justify-center bg-black/30">
					<View className="items-center gap-2 rounded-xl bg-black/55 px-5 py-4">
						<Spinner className="text-white" size="small" />
						<Text className="text-sm text-white">Alternando modo...</Text>
					</View>
				</View>
			)}
		</>
	);
}
