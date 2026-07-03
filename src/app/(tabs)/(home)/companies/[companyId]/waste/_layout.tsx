import { Stack } from "expo-router";

export default function WasteLayout() {
	return (
		<Stack screenOptions={{ headerBackButtonDisplayMode: "minimal" }}>
			<Stack.Screen
				name="index"
				options={{ title: "Resíduos", headerShown: true }}
			/>
			<Stack.Screen
				name="form"
				options={{ title: "Resíduo", headerShown: true }}
			/>
		</Stack>
	);
}
