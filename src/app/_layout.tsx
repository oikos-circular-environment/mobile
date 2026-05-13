import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { GeospatialProvider } from "@/contexts/geospatial-context";
import { NotificationProvider } from "@/contexts/notification-context";
import { UserProvider } from "@/contexts/user-context";
import "react-native-reanimated";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import "./global.css";
import "@/libs/api/oikos-api";

export const unstable_settings = {
	anchor: "(tabs)",
};

const queryClient = new QueryClient();

export default function RootLayout() {
	return (
		<QueryClientProvider client={queryClient}>
			<UserProvider>
				<GeospatialProvider>
					<NotificationProvider>
						<GluestackUIProvider mode="light">
							<SafeAreaProvider>
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
									<StatusBar style="dark" animated />
								</SafeAreaView>
							</SafeAreaProvider>
						</GluestackUIProvider>
					</NotificationProvider>
				</GeospatialProvider>
			</UserProvider>
		</QueryClientProvider>
	);
}
