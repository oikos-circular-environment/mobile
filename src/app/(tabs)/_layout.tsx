import { Tabs } from "expo-router";
import { Leaf, MapPin, Shield } from "lucide-react-native";

// const TAB_BAR_HEIGHT = 64;
// const TAB_BAR_MARGIN_BOTTOM = 0;

export const unstable_settings = {
	initialRouteName: "(home)",
};

export default function TabsNavigator() {
	// const { bottom } = useSafeAreaInsets();
	// const tabBarBottom = bottom + TAB_BAR_MARGIN_BOTTOM;

	return (
		<Tabs
			// sceneStyle={{ paddingBottom: TAB_BAR_HEIGHT + tabBarBottom }}
			// screenOptions={{
			// 	tabBarActiveTintColor: "#f5f5f5",
			// 	tabBarInactiveTintColor: "rgba(255,255,255,0.5)",
			// 	headerShown: false,
			// 	tabBarBackground: () => null,
			// 	tabBarStyle: {
			// 		paddingTop: 4,
			// 		position: "absolute",
			// 		bottom: tabBarBottom,
			// 		// left: 16,
			// 		// right: 16,
			// 		marginLeft: 16,
			// 		marginRight: 16,
			// 		borderRadius: 30,
			// 		height: TAB_BAR_HEIGHT,
			// 		backgroundColor: "#3d6300",
			// 		borderTopWidth: 0,
			// 		elevation: 0,
			// 		shadowColor: "#000",
			// 		shadowOffset: { width: 0, height: 4 },
			// 		shadowOpacity: 0.12,
			// 		shadowRadius: 8,
			// 	},
			// }}
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: "#f5f5f5",
				tabBarInactiveTintColor: "rgba(255,255,255,0.5)",
				tabBarStyle: {
					backgroundColor: "#3d6300",
				},
			}}
		>
			<Tabs.Screen
				name="market"
				options={{
					title: "Pontos de coleta",
					tabBarIcon: ({ color, size }) => <MapPin color={color} size={size} />,
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
			<Tabs.Screen
				name="learn"
				options={{
					href: null,
				}}
			/>
		</Tabs>
	);
}
