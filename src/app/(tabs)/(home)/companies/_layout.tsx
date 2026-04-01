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
        name="payment-methods"
        options={{
          title: "Métodos de pagamento",
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
  );
}
