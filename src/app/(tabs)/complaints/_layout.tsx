import { Stack } from "expo-router";
import { ComplaintsProvider } from "@/contexts/complaints-context";

export default function ComplaintsStackLayout() {
	return (
		<ComplaintsProvider>
			<Stack>
				<Stack.Screen name="index" options={{ headerShown: false }} />
				<Stack.Screen
					name="(create)"
					options={{
						headerShown: false,
						presentation: "fullScreenModal",
					}}
				/>
			</Stack>
		</ComplaintsProvider>
	);
}
