import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import "./global.css";

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {

  return (
    <GluestackUIProvider mode="light">
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="auto" backgroundColor='#ffffff'/>
        </SafeAreaView>
      </SafeAreaProvider>
    </GluestackUIProvider>
  );
}
