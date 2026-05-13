import { Stack } from "expo-router";

export default function MarketStackLayout() {
	return (
		<Stack>
			<Stack.Screen name="index" options={{ headerShown: false }} />
			<Stack.Screen
				name="[companyId]"
				options={{ headerShown: false, title: "Empresa" }}
			/>
		</Stack>
	);
}
