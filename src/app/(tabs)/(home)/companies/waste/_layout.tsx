import { Stack } from "expo-router";

export default function WasteLayout() {
	return (
		<Stack>
			<Stack.Screen
				name="index"
				options={{
					title: "Resíduos",
					headerShown: false,
				}}
			/>
			<Stack.Screen
				name="form"
				options={{
					title: "Resíduos",
					headerShown: false,
				}}
			/>
		</Stack>
	);
}
