import { Stack } from "expo-router";
import { ClockProvider } from "@/contexts/clock-context";
import { MarketProvider } from "@/contexts/market-context";

export default function MarketStackLayout() {
	return (
		<ClockProvider>
			<MarketProvider>
				<Stack>
					<Stack.Screen name="index" options={{ headerShown: false }} />
					<Stack.Screen
						name="[companyId]"
						options={{ headerShown: true, title: "Empresa" }}
					/>
				</Stack>
			</MarketProvider>
		</ClockProvider>
	);
}
