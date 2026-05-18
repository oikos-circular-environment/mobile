import { Stack } from "expo-router";
import { UserCompanyProvider } from "@/contexts/user-company-context";

export default function CompaniesLayout() {
	return (
		<UserCompanyProvider>
		<Stack
			screenOptions={{
				headerBackButtonDisplayMode: "minimal",
			}}
		>
			<Stack.Screen
				name="index"
				options={{
					title: "Empresa",
					headerShown: false,
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
				name="financial-methods"
				options={{
					title: "Métodos financeiros",
					headerShown: true,
				}}
			/>
			<Stack.Screen
				name="services"
				options={{
					title: "Serviços",
					headerShown: true,
				}}
			/>
			<Stack.Screen
				name="waste-management"
				options={{
					title: "Gestão de resíduos",
					headerShown: true,
				}}
			/>
		</Stack>
		</UserCompanyProvider>
	);
}
