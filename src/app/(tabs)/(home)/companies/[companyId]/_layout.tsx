import { Stack } from "expo-router";

export default function CompanyLayout() {
	return (
		<Stack
			screenOptions={{
				headerBackButtonDisplayMode: "minimal",
			}}
		>
			<Stack.Screen
				name="index"
				options={{
					title: "Empresa",
					headerShown: true,
				}}
			/>
			<Stack.Screen
				name="company"
				options={{
					title: "Empresa",
					headerShown: true,
				}}
			/>
			<Stack.Screen
				name="address"
				options={{
					title: "Endereço",
					headerShown: true,
				}}
			/>
			<Stack.Screen
				name="business-hours"
				options={{
					title: "Funcionamento",
					headerShown: true,
				}}
			/>
			<Stack.Screen
				name="services"
				options={{
					headerShown: false,
				}}
			/>
			<Stack.Screen
				name="waste"
				options={{
					headerShown: false,
				}}
			/>
		</Stack>
	);
}
