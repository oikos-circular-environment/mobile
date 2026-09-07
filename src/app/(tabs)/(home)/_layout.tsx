import { Stack } from "expo-router";
import { useAuthContext } from "@/contexts/auth-context";

export default function HomeStackLayout() {
	const { isAuthenticated } = useAuthContext();
	return (
		<Stack
			screenOptions={{
				headerBackButtonDisplayMode: "minimal",
			}}
		>
			<Stack.Screen
				name="index"
				options={{ headerShown: false, title: "Início" }}
			/>
			<Stack.Protected guard={isAuthenticated}>
				<Stack.Screen
					name="profile"
					options={{ title: "Perfil", headerShown: false }}
				/>
				<Stack.Screen name="account" options={{ title: "Conta" }} />
				<Stack.Screen name="support" options={{ headerShown: false }} />
			</Stack.Protected>
			<Stack.Screen
				name="companies"
				options={{ title: "Empresa", headerShown: false }}
			/>
			<Stack.Screen
				name="sign-in"
				options={{
					title: "Login",
					headerShown: false,
				}}
			/>
			<Stack.Screen
				name="sign-up"
				options={{
					title: "Cadastro",
					headerShown: false,
				}}
			/>
		</Stack>
	);
}
