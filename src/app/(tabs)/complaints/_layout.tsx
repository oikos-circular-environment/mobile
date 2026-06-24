import { Stack } from "expo-router";
import { ComplaintCreationProvider } from "@/contexts/complaint-creation-context";

export default function ComplaintsStackLayout() {
	return (
		<ComplaintCreationProvider>
			<Stack>
				<Stack.Screen name="index" options={{ headerShown: false }} />
				<Stack.Screen name="list" options={{ headerShown: false }} />
				<Stack.Screen name="(create)" options={{ headerShown: false }} />
				<Stack.Screen
					name="resolution"
					options={{ headerShown: false, presentation: "modal" }}
				/>
			</Stack>
		</ComplaintCreationProvider>
	);
}
