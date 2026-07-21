import { Linking, Platform } from "react-native";

const appleMapsUrl = (latitude: number, longitude: number) =>
	`https://maps.apple.com/?daddr=${latitude},${longitude}`;

const googleMapsIosUrl = (latitude: number, longitude: number) =>
	`comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=driving`;

const googleMapsWebUrl = (latitude: number, longitude: number) =>
	`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

export async function openAppleMaps(latitude: number, longitude: number) {
	await Linking.openURL(appleMapsUrl(latitude, longitude));
}

export async function openGoogleMaps(latitude: number, longitude: number) {
	if (Platform.OS !== "ios") {
		await Linking.openURL(googleMapsWebUrl(latitude, longitude));
		return;
	}

	try {
		await Linking.openURL(googleMapsIosUrl(latitude, longitude));
	} catch {
		await Linking.openURL(googleMapsWebUrl(latitude, longitude));
	}
}

export async function openInMaps(latitude: number, longitude: number) {
	if (Platform.OS === "ios") {
		await openAppleMaps(latitude, longitude);
		return;
	}

	const url = `geo:${latitude},${longitude}?q=${latitude},${longitude}`;
	try {
		const canOpen = await Linking.canOpenURL(url);
		await Linking.openURL(
			canOpen ? url : googleMapsWebUrl(latitude, longitude),
		);
	} catch {
		await Linking.openURL(googleMapsWebUrl(latitude, longitude));
	}
}
