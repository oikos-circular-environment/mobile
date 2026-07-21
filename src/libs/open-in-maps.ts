import { ActionSheetIOS, Linking, Platform } from "react-native";

const GOOGLE_MAPS_IOS_SCHEME = "comgooglemaps://";

const appleMapsUrl = (latitude: number, longitude: number) =>
	`https://maps.apple.com/?ll=${latitude},${longitude}`;

const googleMapsIosUrl = (latitude: number, longitude: number) =>
	`comgooglemaps://?q=${latitude},${longitude}`;

const googleMapsWebUrl = (latitude: number, longitude: number) =>
	`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

async function canOpenURL(url: string): Promise<boolean> {
	try {
		return await Linking.canOpenURL(url);
	} catch {
		return false;
	}
}

async function openInMapsIOS(latitude: number, longitude: number) {
	const hasGoogleMaps = await canOpenURL(GOOGLE_MAPS_IOS_SCHEME);

	if (!hasGoogleMaps) {
		await Linking.openURL(appleMapsUrl(latitude, longitude));
		return;
	}

	const selectedIndex = await new Promise<number>(resolve => {
		ActionSheetIOS.showActionSheetWithOptions(
			{
				title: "Selecione uma ação",
				options: ["Abrir com Mapas", "Abrir com Google Maps", "Cancelar"],
				cancelButtonIndex: 2,
			},
			resolve,
		);
	});

	if (selectedIndex === 0) {
		await Linking.openURL(appleMapsUrl(latitude, longitude));
	} else if (selectedIndex === 1) {
		await Linking.openURL(googleMapsIosUrl(latitude, longitude));
	}
}

async function openInMapsAndroid(latitude: number, longitude: number) {
	const url = `geo:${latitude},${longitude}?q=${latitude},${longitude}`;
	const canOpen = await canOpenURL(url);
	await Linking.openURL(canOpen ? url : googleMapsWebUrl(latitude, longitude));
}

export async function openInMaps(latitude: number, longitude: number) {
	if (Platform.OS === "ios") {
		await openInMapsIOS(latitude, longitude);
		return;
	}
	await openInMapsAndroid(latitude, longitude);
}
