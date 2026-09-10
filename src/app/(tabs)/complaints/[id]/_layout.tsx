import { Stack } from "expo-router";

export default function ComplaintDetailStackLayout() {
	return (
		<Stack screenOptions={{ headerBackButtonDisplayMode: "minimal" }}>
			<Stack.Screen name="index" options={{ title: "Descarte Irregular" }} />
			<Stack.Screen name="resolution" options={{ title: "Resolução" }} />
		</Stack>
	);
}
