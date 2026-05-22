import Ionicons from "@expo/vector-icons/Ionicons";
import { Icon, Label, NativeTabs, VectorIcon } from "expo-router/unstable-native-tabs";

export const unstable_settings = {
	initialRouteName: "(home)",
};

export default function TabsNavigator() {
	return (
		<NativeTabs tintColor="#3d6300">
			<NativeTabs.Trigger name="market">
				<Icon
					sf={{ default: "mappin.and.ellipse.circle", selected: "mappin.and.ellipse.circle.fill" }}
					androidSrc={{
						default: <VectorIcon family={Ionicons} name="location-outline" />,
						selected: <VectorIcon family={Ionicons} name="location" />,
					}}
				/>
				<Label>Pontos de coleta</Label>
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="(home)">
				<Icon
					sf={{ default: "leaf", selected: "leaf.fill" }}
					androidSrc={{
						default: <VectorIcon family={Ionicons} name="leaf-outline" />,
						selected: <VectorIcon family={Ionicons} name="leaf" />,
					}}
				/>
				<Label>Home</Label>
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="complaints">
				<Icon
					sf={{ default: "shield", selected: "shield.fill" }}
					androidSrc={{
						default: <VectorIcon family={Ionicons} name="shield-outline" />,
						selected: <VectorIcon family={Ionicons} name="shield" />,
					}}
				/>
				<Label>Denunciar</Label>
			</NativeTabs.Trigger>

			{/* <NativeTabs.Trigger name="donations">
        <Icon sf={{ default: "globe", selected: "globe" }} />
        <Label>Doações</Label>
        </NativeTabs.Trigger> */}

			{/* <NativeTabs.Trigger name="learn">
        <Icon sf={{ default: "book", selected: "book.fill" }} />
        <Label>Aprender</Label>
        </NativeTabs.Trigger> */}
		</NativeTabs>
	);
}
