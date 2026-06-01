import { Stack } from "expo-router";

export default function ComplaintDetailLayout() {
	return (
		<Stack>
			<Stack.Screen name="index" options={{ headerShown: false }} />
			<Stack.Screen name="resolution" options={{ headerShown: false }} />
		</Stack>
	);
}
