import { Stack } from "expo-router";
import { useLoadSupportRequests } from "@/components/support/hooks/use-load-support-requests";

export default function SupportStackLayout() {
	useLoadSupportRequests();

	return (
		<Stack
			screenOptions={{
				headerBackButtonDisplayMode: "minimal",
			}}
		>
			<Stack.Screen name="index" options={{ title: "Meus Chamados" }} />
			<Stack.Screen name="[id]" options={{ title: "Chamado" }} />
		</Stack>
	);
}
