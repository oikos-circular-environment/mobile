import { Stack } from "expo-router";
import { ComplaintBottomSheet } from "@/components/complaints/complaint-bottom-sheet";

export default function ComplaintsStackLayout() {
	return (
		<>
			<Stack>
				<Stack.Screen name="index" options={{ headerShown: false }} />
				<Stack.Screen name="list" options={{ headerShown: false }} />
				<Stack.Screen name="(create)" options={{ headerShown: false }} />
				<Stack.Screen
					name="resolution"
					options={{ headerShown: false, presentation: "modal" }}
				/>
			</Stack>
			<ComplaintBottomSheet />
		</>
	);
}
