import type { ExpoConfig } from "expo/config";

const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

const config: ExpoConfig = {
	name: "oikos",
	slug: "oikos",
	version: "1.0.4",
	orientation: "default",
	icon: "./src/assets/icons/icon.png",
	scheme: "oikos",
	userInterfaceStyle: "light",
	ios: {
		bundleIdentifier: "com.oikos",
		supportsTablet: true,
		config: {
			googleMapsApiKey,
		},
		infoPlist: {
			ITSAppUsesNonExemptEncryption: false,
		},
	},
	android: {
		package: "com.oikos",
		adaptiveIcon: {
			backgroundColor: "#274E2D",
			foregroundImage: "./src/assets/icons/android-icon.png",
		},
		predictiveBackGestureEnabled: false,
		config: {
			googleMaps: {
				apiKey: googleMapsApiKey,
			},
		},
		permissions: [
			"android.permission.ACCESS_COARSE_LOCATION",
			"android.permission.ACCESS_FINE_LOCATION",
			"android.permission.CAMERA",
			"android.permission.RECORD_AUDIO",
		],
	},
	plugins: [
		"expo-router",
		[
			"expo-splash-screen",
			{
				image: "./src/assets/icons/splash-icon.png",
				imageWidth: 200,
				resizeMode: "contain",
				backgroundColor: "#274E2D",
			},
		],
		[
			"expo-location",
			{
				locationAlwaysAndWhenInUsePermission:
					"$(PRODUCT_NAME) usa sua localização para registrar onde as ocorrências ambientais acontecem.",
				locationWhenInUsePermission:
					"$(PRODUCT_NAME) usa sua localização para registrar onde as ocorrências ambientais acontecem.",
			},
		],
		"expo-localization",
		[
			"expo-camera",
			{
				cameraPermission:
					"$(PRODUCT_NAME) usa a câmera para registrar ocorrências ambientais com fotos e vídeos.",
				microphonePermission:
					"$(PRODUCT_NAME) usa o microfone para gravar vídeos das ocorrências ambientais.",
				recordAudioAndroid: true,
			},
		],
		"expo-video",
		"expo-secure-store",
		"expo-sqlite",
		"expo-font",
		"expo-image",
		"expo-web-browser",
		"expo-status-bar",
		[
			"react-native-maps",
			{
				iosGoogleMapsApiKey: googleMapsApiKey,
				androidGoogleMapsApiKey: googleMapsApiKey,
			},
		],
	],
	experiments: {
		typedRoutes: true,
		reactCompiler: true,
	},
	extra: {
		router: {},
		eas: {
			projectId: "1ec73321-5c0d-469a-ae1d-407bf5345183",
		},
	},
	owner: "oikos-circular-environment",
	platforms: ["ios", "android"],
	runtimeVersion: {
		policy: "fingerprint",
	},
	updates: {
		url: "https://u.expo.dev/1ec73321-5c0d-469a-ae1d-407bf5345183",
		checkAutomatically: "NEVER",
	},
};

export default config;
