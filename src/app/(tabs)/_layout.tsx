import { Tabs } from "expo-router";
import { Leaf, RecycleIcon, Shield } from "lucide-react-native";
import { colors } from "@/components/style/colors";
import { useAuthContext } from "@/contexts/auth-context";

// const TAB_BAR_HEIGHT = 64;
// const TAB_BAR_MARGIN_BOTTOM = 0;

export const unstable_settings = {
	initialRouteName: "(home)",
};

export default function TabsNavigator() {
	// const { bottom } = useSafeAreaInsets();
	// const tabBarBottom = bottom + TAB_BAR_MARGIN_BOTTOM;
	const { isAuthenticated } = useAuthContext();
	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: colors.gray[100],
				tabBarInactiveTintColor: colors.overlay.white50,
				tabBarStyle: {
					backgroundColor: colors.lime[800],
				},
			}}
		>
			<Tabs.Screen
				name="market"
				options={{
					title: "Pontos de coleta",
					tabBarIcon: ({ color, size }) => (
						<RecycleIcon color={color} size={size} />
					),
				}}
			/>
			<Tabs.Screen
				name="(home)"
				options={{
					title: "Home",
					tabBarIcon: ({ color, size }) => <Leaf color={color} size={size} />,
				}}
			/>
			<Tabs.Screen
				name="complaints"
				options={{
					title: "Denunciar",
					tabBarIcon: ({ color, size }) => <Shield color={color} size={size} />,
				}}
			/>
		</Tabs>
	);
}
