import { Image, StyleSheet, View } from "react-native";

const splashIcon = require("@/assets/icons/splash-icon.png");

export function AppSplashScreen() {
	return (
		<View style={styles.container}>
			<Image source={splashIcon} style={styles.icon} resizeMode="contain" />
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#3f6212",
		alignItems: "center",
		justifyContent: "center",
	},
	icon: {
		width: 200,
		height: 200,
	},
});
