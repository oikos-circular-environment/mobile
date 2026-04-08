import { Stack } from "expo-router";

export default function ComplaintsCreateStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="camera" options={{ headerShown: false }} />
      <Stack.Screen name="review" options={{ headerShown: false }} />
    </Stack>
  );
}
