import { Tabs } from "expo-router";
import { Leaf, MapPin, Shield } from "lucide-react-native";

export const unstable_settings = {
	initialRouteName: "(home)",
};

export default function TabsNavigator() {
	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: "#3d6300",
				headerShown: false,
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
