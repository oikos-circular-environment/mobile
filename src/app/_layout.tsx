import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Observe, ObserveRoot, useObserve } from "expo-observe";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ErrorBoundary } from "@/components/error-boundary";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { AuthContextProvider } from "@/contexts/auth-context";
import { GeospatialProvider } from "@/contexts/geospatial-context";
import { NotificationProvider } from "@/contexts/notification-context";
import { sessionBus } from "@/libs/session-bus";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import "./global.css";
import "@/libs/api/oikos-api";
import { FloatingDevTools } from "@buoy-gg/core";
import { Oswald_700Bold, useFonts } from "@expo-google-fonts/oswald";
import { SpaceGrotesk_400Regular } from "@expo-google-fonts/space-grotesk";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { AppSplashScreen } from "@/components/app-splash-screen";
import { Toaster } from "@/components/toast";

export const unstable_settings = {
	anchor: "(tabs)",
};

const queryClient = new QueryClient();
sessionBus.subscribe(() => queryClient.resetQueries());

Observe.configure({
	integrations: { "expo-router": true },
	dispatchInDebug: true,
});

function RootLayout() {
	const [loaded, error] = useFonts({
		Oswald_700Bold,
		SpaceGrotesk_400Regular,
	});
	const { markInteractive } = useObserve();

	useEffect(() => {
		if (loaded || error) {
			SplashScreen.hideAsync().catch(() => {});
			markInteractive();
		}
	}, [loaded, error, markInteractive]);

	if (!loaded && !error) {
		return <AppSplashScreen />;
	}

	const isDevelopmentMode = process.env.NODE_ENV === "development";

	return (
		<GestureHandlerRootView style={{ flex: 1, backgroundColor: "white" }}>
			<ErrorBoundary>
				<GluestackUIProvider mode="light">
					<QueryClientProvider client={queryClient}>
						<AuthContextProvider>
							<GeospatialProvider>
								<NotificationProvider>
									<SafeAreaProvider>
										<Toaster />
										<StatusBar style="dark" animated />
										<SafeAreaView
											style={{ flex: 1, backgroundColor: "white" }}
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
						</AuthContextProvider>
						{isDevelopmentMode && <FloatingDevTools />}
					</QueryClientProvider>
				</GluestackUIProvider>
			</ErrorBoundary>
		</GestureHandlerRootView>
	);
}

export default ObserveRoot.wrap(RootLayout);
