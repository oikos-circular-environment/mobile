import { Stack } from "expo-router";
import { MarketProvider } from "@/contexts/market-context";

export default function MarketStackLayout() {
	return (
		<MarketProvider>
			<Stack>
				<Stack.Screen name="index" options={{ headerShown: false }} />
				<Stack.Screen
					name="[companyId]"
					options={{ headerShown: false, title: "Empresa" }}
				/>
			</Stack>
		</MarketProvider>
	);
}
