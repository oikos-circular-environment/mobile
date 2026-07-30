import { Stack } from "expo-router";

export default function SurveyStackLayout() {
	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Screen name="index" />
			<Stack.Screen name="location" />
			<Stack.Screen name="location-denied" />
			<Stack.Screen name="consent" />
			<Stack.Screen name="consent-ended" />
		</Stack>
	);
}
