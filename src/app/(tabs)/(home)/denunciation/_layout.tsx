import { Stack } from "expo-router";
import { useLoadDenunciations } from "@/components/denunciation/hooks/use-load-denunciations";

export default function DenunciationStackLayout() {
	useLoadDenunciations();

	return (
		<Stack
			screenOptions={{
				headerBackButtonDisplayMode: "minimal",
			}}
		>
			<Stack.Screen name="index" options={{ title: "Minhas Denúncias" }} />
			<Stack.Screen name="[id]" options={{ title: "Denúncia" }} />
		</Stack>
	);
}
