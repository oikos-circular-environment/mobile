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
        options={{ headerShown: true, title: "Início" }}
      />
      <Stack.Screen
        name="settings"
        options={{ title: "Configurações", headerShown: true }}
      />
      <Stack.Screen
        name="plans"
        options={{ title: "Planos", headerShown: true }}
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
