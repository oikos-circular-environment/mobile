import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Observe, ObserveRoot, useObserve } from "expo-observe";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withTiming,
} from "react-native-reanimated";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { ErrorBoundary } from "@/components/error-boundary";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { AuthContextProvider } from "@/contexts/auth-context";
import { GeospatialProvider } from "@/contexts/geospatial-context";
import { NotificationProvider } from "@/contexts/notification-context";
import { sessionBus } from "@/libs/session-bus";
import "./global.css";
import "@/libs/api/oikos-api";
import { FloatingDevTools } from "@buoy-gg/core";
import { Oswald_700Bold, useFonts } from "@expo-google-fonts/oswald";
import { SpaceGrotesk_400Regular } from "@expo-google-fonts/space-grotesk";
import { BlurView } from "expo-blur";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import {
	AppSplashScreen,
	SplashBackdrop,
} from "@/components/app-splash-screen";
import { Toaster } from "@/components/toast";

export const unstable_settings = {
	anchor: "(tabs)",
};

const queryClient = new QueryClient();
sessionBus.subscribe(() => queryClient.resetQueries());

Observe.configure({
	integrations: { "expo-router": true },
});

const SPLASH_VIDEO_DURATION_MS = 10000;

type SplashStage = "video" | "handoff" | "app";

const REVEAL_LINGER_MS = 120;
const REVEAL_FADE_MS = 500;

function RootLayout() {
	const [loaded, error] = useFonts({
		Oswald_700Bold,
		SpaceGrotesk_400Regular,
	});
	const { markInteractive } = useObserve();
	const [stage, setStage] = useState<SplashStage>("video");
	const revealBlurOpacity = useSharedValue(1);

	useEffect(() => {
		const timeout = setTimeout(
			() => setStage("handoff"),
			SPLASH_VIDEO_DURATION_MS,
		);
		return () => clearTimeout(timeout);
	}, []);

	useEffect(() => {
		if (stage === "handoff" && (loaded || error)) {
			const raf = requestAnimationFrame(() => setStage("app"));
			return () => cancelAnimationFrame(raf);
		}
	}, [stage, loaded, error]);

	useEffect(() => {
		if (stage === "app") {
			SplashScreen.hideAsync().catch(() => {});
			markInteractive();
			revealBlurOpacity.value = withDelay(
				REVEAL_LINGER_MS,
				withTiming(0, { duration: REVEAL_FADE_MS }),
			);
		}
	}, [stage, markInteractive, revealBlurOpacity]);

	const revealBlurStyle = useAnimatedStyle(() => ({
		opacity: revealBlurOpacity.value,
	}));

	if (stage === "video") {
		return <AppSplashScreen />;
	}

	if (stage === "handoff") {
		return <SplashBackdrop />;
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
			<Animated.View
				style={[StyleSheet.absoluteFill, revealBlurStyle]}
				pointerEvents="none"
			>
				<BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
			</Animated.View>
		</GestureHandlerRootView>
	);
}

export default ObserveRoot.wrap(RootLayout);
