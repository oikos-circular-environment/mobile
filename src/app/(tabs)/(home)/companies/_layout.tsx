import { Stack } from "expo-router";
import { useLoadCompanies } from "@/components/companies/hooks/use-load-companies";

export default function CompaniesLayout() {
	useLoadCompanies();

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
				name="[companyId]"
				options={{
					headerShown: false,
				}}
			/>
		</Stack>
	);
}
