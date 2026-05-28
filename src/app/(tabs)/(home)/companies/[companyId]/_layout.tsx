import { Stack, useLocalSearchParams } from "expo-router";
import { UserCompanyProvider } from "@/contexts/user-company-context";

export default function CompanyLayout() {
	const { companyId } = useLocalSearchParams<{ companyId: string }>();

	return (
		<UserCompanyProvider companyId={companyId}>
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
						headerShown: false,
					}}
				/>
				<Stack.Screen
					name="address"
					options={{
						title: "Endereço",
						headerShown: false,
					}}
				/>
				<Stack.Screen
					name="business-hours"
					options={{
						title: "Funcionamento",
						headerShown: false,
					}}
				/>
				<Stack.Screen
					name="services"
					options={{
						title: "Serviços",
						headerShown: false,
					}}
				/>
				<Stack.Screen
					name="waste"
					options={{
						title: "Resíduos",
						headerShown: false,
					}}
				/>
			</Stack>
		</UserCompanyProvider>
	);
}
