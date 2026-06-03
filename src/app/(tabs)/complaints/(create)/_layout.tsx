import { Stack } from "expo-router";
import { ComplaintCreationProvider } from "@/contexts/complaint-creation-context";

export default function ComplaintsCreateStackLayout() {
	return (
		<ComplaintCreationProvider>
			<Stack>
				<Stack.Screen name="index" options={{ headerShown: false }} />
				<Stack.Screen name="camera" options={{ headerShown: false }} />
				<Stack.Screen
					name="preview"
					options={{
						headerShown: false,
						presentation: "fullScreenModal",
						animation: "fade",
					}}
				/>
			</Stack>
		</ComplaintCreationProvider>
	);
}
