import { Observe } from "expo-observe";

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

export type GoogleAddressFields = {
	street: string;
	streetNumber: string;
	district: string;
	city: string;
	region: string;
	postalCode: string;
	latitude: string;
	longitude: string;
};

type GeocodingComponent = {
	long_name: string;
	short_name: string;
	types: string[];
};

export async function reverseGeocode(
	lat: number,
	lon: number,
): Promise<GoogleAddressFields | null> {
	try {
		const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${API_KEY}&language=pt-BR&region=BR`;
		const response = await fetch(url);
		const data = (await response.json()) as {
			status: string;
			results: Array<{ address_components: GeocodingComponent[] }>;
		};

		if (data.status !== "OK" || !data.results[0]) return null;

		const components = data.results[0].address_components;
		const get = (
			type: string,
			nameType: "long_name" | "short_name" = "long_name",
		) => components.find(c => c.types.includes(type))?.[nameType] ?? "";

		const rawPostcode = get("postal_code");
		const postalCode = rawPostcode
			.replace(/\D/g, "")
			.replace(/^(\d{5})(\d{1,3})$/, "$1-$2");

		return {
			street: get("route"),
			streetNumber: get("street_number"),
			district: get("sublocality_level_1") || get("sublocality"),
			city: get("administrative_area_level_2"),
			region: get("administrative_area_level_1", "short_name"),
			postalCode,
			latitude: String(lat),
			longitude: String(lon),
		};
	} catch (error) {
		Observe.reportError(error);
		return null;
	}
}
