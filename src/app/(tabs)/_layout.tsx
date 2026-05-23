import { Tabs } from "expo-router";
import { Leaf, MapPin, Shield } from "lucide-react-native";

export const unstable_settings = {
	initialRouteName: "(home)",
};

export default function TabsNavigator() {
	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: "#f5f5f5",
				tabBarInactiveTintColor: "rgba(255,255,255,0.5)",
				headerShown: false,
				tabBarBackground: () => null,
				tabBarStyle: {
					paddingTop: 4,
					marginHorizontal: 16,
					marginBottom: 20,
					borderRadius: 30,
					height: 64,
					backgroundColor: "rgba(61, 99, 0, 0.75)",
					borderTopWidth: 0,
					elevation: 0,
					shadowColor: "#000",
					shadowOffset: { width: 0, height: 4 },
					shadowOpacity: 0.12,
					shadowRadius: 8,
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
