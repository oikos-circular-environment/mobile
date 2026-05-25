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
import { Toaster } from "@/components/toast";

export const unstable_settings = {
	anchor: "(tabs)",
};

const queryClient = new QueryClient();

export default function RootLayout() {
	const isDevelopmentMode = process.env.NODE_ENV === "development";

	return (
		<GluestackUIProvider mode="light">
			<QueryClientProvider client={queryClient}>
				<UserProvider>
					<GeospatialProvider>
						<NotificationProvider>
							<GestureHandlerRootView style={{ flex: 1 }}>
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
							</GestureHandlerRootView>
						</NotificationProvider>
					</GeospatialProvider>
				</UserProvider>
				{/* {isDevelopmentMode && <FloatingDevTools />} */}
				{/* <FloatingDevTools userRole={isDevelopmentMode ? "admin" : "user"} /> */}
			</QueryClientProvider>
		</GluestackUIProvider>
	);
}
