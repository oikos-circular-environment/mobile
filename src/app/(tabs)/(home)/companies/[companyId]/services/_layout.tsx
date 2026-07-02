import { Stack } from "expo-router";

export default function ServicesLayout() {
	return (
		<Stack screenOptions={{ headerBackButtonDisplayMode: "minimal" }}>
			<Stack.Screen name="index" options={{ title: "Serviços", headerShown: true }} />
			<Stack.Screen name="form" options={{ title: "Serviço", headerShown: true }} />
		</Stack>
	);
}
