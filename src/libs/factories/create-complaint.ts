import type { ComplaintCapture } from "../types/complaint";

export function createComplaint(): ComplaintCapture {
	return {
		id: crypto.randomUUID(),
		capture: {
			type: "photo",
			object: {
				uri: "",
			},
		},
		date: new Date().toISOString(),
		geospatial: {
			heading: {
				accuracy: 1,
				trueHeading: 0,
				magHeading: 0,
			},
			location: {
				coords: {
					accuracy: 1,
					altitude: 0,
					latitude: 0,
					longitude: 0,
					altitudeAccuracy: 1,
					heading: 0,
					speed: 0,
				},
				timestamp: Date.now(),
				mocked: true,
			},
			addresses: {
				streetNumber: null,
				street: null,
				city: null,
				country: null,
				postalCode: null,
				region: null,
				subregion: null,
				district: null,
				formattedAddress: null,
				isoCountryCode: null,
				name: null,
				timezone: null,
			},
		},
		observation: "",
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
	};
}
