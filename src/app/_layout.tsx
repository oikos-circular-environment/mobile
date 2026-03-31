import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { UserProvider } from "@/contexts/user-context";
import "react-native-reanimated";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import "./global.css";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  return (
    <UserProvider>
      <GluestackUIProvider mode="light">
        <SafeAreaProvider>
          <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
            <StatusBar style="dark" animated />
          </SafeAreaView>
        </SafeAreaProvider>
      </GluestackUIProvider>
    </UserProvider>
  );
}
