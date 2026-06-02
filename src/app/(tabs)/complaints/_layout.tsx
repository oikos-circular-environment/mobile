import { Stack } from "expo-router";

export default function ComplaintsStackLayout() {
	return (
		<Stack>
			<Stack.Screen name="index" options={{ headerShown: false }} />
			<Stack.Screen name="list" options={{ headerShown: false }} />
			<Stack.Screen
				name="(create)"
				options={{ headerShown: false, presentation: "fullScreenModal" }}
			/>
			<Stack.Screen
				name="resolution"
				options={{ headerShown: false, presentation: "modal" }}
			/>
		</Stack>
	);
}
