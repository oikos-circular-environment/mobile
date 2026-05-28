import { Stack } from "expo-router";

export default function CompaniesLayout() {
	return (
		<Stack
			screenOptions={{
				headerBackButtonDisplayMode: "minimal",
			}}
		>
			<Stack.Screen
				name="index"
				options={{
					title: "Minhas Empresas",
					headerShown: false,
				}}
			/>
			<Stack.Screen
				name="create"
				options={{
					title: "Cadastrar Empresa",
					headerShown: false,
				}}
			/>
			<Stack.Screen
				name="[companyId]"
				options={{
					headerShown: false,
				}}
			/>
		</Stack>
	);
}
