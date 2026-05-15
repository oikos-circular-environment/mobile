import { Stack } from "expo-router";

export default function HomeStackLayout() {
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
			<Stack.Screen
				name="settings"
				options={{ title: "Configurações", headerShown: false }}
			/>
			<Stack.Screen
				name="profile"
				options={{ title: "Perfil", headerShown: true }}
			/>
			<Stack.Screen
				name="notifications"
				options={{ title: "Notificações", headerShown: false }}
			/>
			<Stack.Screen
				name="plans"
				options={{ title: "Planos", headerShown: false }}
			/>
			<Stack.Screen
				name="companies"
				options={{ title: "Empresa", headerShown: false }}
			/>
			<Stack.Screen
				name="collectors"
				options={{ title: "Para coletores", headerShown: false }}
			/>
			<Stack.Screen
				name="sponsors"
				options={{ title: "Patrocinadores", headerShown: false }}
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
			<Stack.Screen
				name="verify-code"
				options={{
					title: "Confirmar e-mail",
					headerShown: false,
				}}
			/>
		</Stack>
	);
}
