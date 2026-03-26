import { Stack } from "expo-router";

export default function HomeStackLayout() {
  return (
    <Stack>
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
    </Stack>
  );
}
