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
import { Oswald_700Bold, useFonts } from "@expo-google-fonts/oswald";
import { ReemKufi_700Bold } from "@expo-google-fonts/reem-kufi";
import { SpaceGrotesk_400Regular } from "@expo-google-fonts/space-grotesk";
import { BlurView } from "expo-blur";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { BootSplashScreen } from "@/components/boot-splash-screen";
import { SurveyExecutionOverlay } from "@/components/survey/survey-execution-overlay";
import { SurveyMigrationsRunner } from "@/components/survey/survey-migrations-runner";
import { Toaster } from "@/components/toast";
import { initSurveyQueue } from "@/libs/survey/queue/network-status";
import { useSurveyStore } from "@/stores/survey-store";

export const unstable_settings = {
	anchor: "(tabs)",
};

const queryClient = new QueryClient();
sessionBus.subscribe(() => queryClient.resetQueries());
initSurveyQueue(() => useSurveyStore.getState().sessionId);

Observe.configure({
	integrations: { "expo-router": true },
});

type SplashStage = "boot" | "app";

const REVEAL_LINGER_MS = 120;
const REVEAL_FADE_MS = 500;

const isDevelopmentMode = process.env.NODE_ENV === "development";

// Mantém a splash nativa (imagem estática do app.config.ts) até as fontes
// carregarem — sem isso, o primeiro render em branco do RootLayout já
// dispara o auto-hide nativo e deixa uma tela em branco por um instante.
SplashScreen.preventAutoHideAsync().catch(() => {});

// @buoy-gg/core drags in shared-ui/floating-tools-core/license and is only
// ever rendered in dev. A static import would evaluate all of that on every
// boot, dev or not — require() behind __DEV__ keeps it out of the production
// bundle's evaluation path entirely.
const FloatingDevTools = __DEV__
	? (require("@buoy-gg/core") as typeof import("@buoy-gg/core"))
			.FloatingDevTools
	: null;

function RootLayout() {
	const [loaded, error] = useFonts({
		Oswald_700Bold,
		ReemKufi_700Bold,
		SpaceGrotesk_400Regular,
	});
	const fontsReady = loaded || error;
	const { markInteractive } = useObserve();
	const [stage, setStage] = useState<SplashStage>("boot");
	const revealBlurOpacity = useSharedValue(1);

	useEffect(() => {
		if (fontsReady) {
			SplashScreen.hideAsync().catch(() => {});
		}
	}, [fontsReady]);

	useEffect(() => {
		if (stage === "app") {
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

	if (!fontsReady) {
		return null;
	}

	if (stage === "boot") {
		return <BootSplashScreen onReady={() => setStage("app")} />;
	}

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
											edges={["left", "right"]}
										>
											<Stack>
												<Stack.Screen
													name="(tabs)"
													options={{ headerShown: false }}
												/>
												<Stack.Screen
													name="survey"
													options={{
														headerShown: false,
														presentation: "fullScreenModal",
													}}
												/>
											</Stack>
										</SafeAreaView>
									</SafeAreaProvider>
								</NotificationProvider>
							</GeospatialProvider>
						</AuthContextProvider>
						{isDevelopmentMode && <FloatingDevTools />}
						<SurveyMigrationsRunner />
						<SurveyExecutionOverlay />
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
