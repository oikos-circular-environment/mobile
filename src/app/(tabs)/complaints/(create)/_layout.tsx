import { Stack } from "expo-router";

export default function ComplaintsCreateStackLayout() {
	return (
		<Stack>
			<Stack.Screen name="index" options={{ headerShown: false }} />
			<Stack.Screen name="camera" options={{ headerShown: false }} />
			<Stack.Screen
				name="preview"
				options={{
					headerShown: false,
					presentation: "fullScreenModal",
					animation: "fade",
				}}
			/>
		</Stack>
	);
}
