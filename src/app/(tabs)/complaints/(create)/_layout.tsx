import { Stack } from "expo-router";
import { ComplaintCreateProvider } from "../../../../contexts/create-complaint-context";

export default function ComplaintsCreateStackLayout() {
  return (
    <ComplaintCreateProvider>
      <Stack>
        <Stack.Screen name="camera" options={{ headerShown: false }} />
        <Stack.Screen name="review" options={{ headerShown: false }} />
      </Stack>
    </ComplaintCreateProvider>
  );
}
