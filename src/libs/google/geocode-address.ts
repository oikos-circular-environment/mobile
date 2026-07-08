const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

export type GeocodedCoordinates = {
	latitude: string;
	longitude: string;
};

export async function geocodeAddress(
	address: string,
): Promise<GeocodedCoordinates | null> {
	try {
		const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${API_KEY}&language=pt-BR&region=BR`;
		const response = await fetch(url);
		const data = (await response.json()) as {
			status: string;
			results: Array<{ geometry: { location: { lat: number; lng: number } } }>;
		};

		if (data.status !== "OK" || !data.results[0]) return null;

		const { lat, lng } = data.results[0].geometry.location;
		return { latitude: String(lat), longitude: String(lng) };
	} catch {
		return null;
	}
}
