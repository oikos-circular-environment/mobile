import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { UserProvider } from "@/contexts/auth-context";
import { GeospatialProvider } from "@/contexts/geospatial-context";
import { NotificationProvider } from "@/contexts/notification-context";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import "./global.css";
import "@/libs/api/oikos-api";
import { Oswald_700Bold, useFonts } from "@expo-google-fonts/oswald";
import { SpaceGrotesk_400Regular } from "@expo-google-fonts/space-grotesk";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Toaster } from "@/components/toast";

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
	anchor: "(tabs)",
};

const queryClient = new QueryClient();

export default function RootLayout() {
	const [loaded, error] = useFonts({
		Oswald_700Bold,
		SpaceGrotesk_400Regular,
	});

	useEffect(() => {
		if (loaded || error) {
			SplashScreen.hideAsync();
		}
	}, [loaded, error]);

	if (!loaded && !error) {
		return null;
	}

	const isDevelopmentMode = process.env.NODE_ENV === "development";

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<GluestackUIProvider mode="light">
				<QueryClientProvider client={queryClient}>
					<UserProvider>
						<GeospatialProvider>
							<NotificationProvider>
								<SafeAreaProvider>
									<Toaster />
									<StatusBar style="dark" animated />
									<SafeAreaView
										style={{ flex: 1 }}
										edges={["top", "left", "right"]}
									>
										<Stack>
											<Stack.Screen
												name="(tabs)"
												options={{ headerShown: false }}
											/>
										</Stack>
									</SafeAreaView>
								</SafeAreaProvider>
							</NotificationProvider>
						</GeospatialProvider>
					</UserProvider>
					{/* {isDevelopmentMode && <FloatingDevTools />} */}
					{/* <FloatingDevTools userRole={isDevelopmentMode ? "admin" : "user"} /> */}
				</QueryClientProvider>
			</GluestackUIProvider>
		</GestureHandlerRootView>
	);
}
