import type { CameraCapturedPicture } from "expo-camera";
import type * as Location from "expo-location";
import type { ValueMapping } from "./value-mapping";

export type ComplaintType =
	| "irregular_disposal"
	| "deforestation"
	| "burning"
	| "vacant_lot";

export const complaintTypeValues: ValueMapping<ComplaintType>[] = [
	{
		value: "irregular_disposal",
		label: "Descarte Irregular",
		description:
			"Denúncias relacionadas ao descarte inadequado de resíduos, como lixo, entulho, pneus, animais mortos, entre outros.",
	},
	{
		value: "deforestation",
		label: "Desmatamento",
		description:
			"Denúncias relacionadas à remoção ilegal de vegetação, como corte de árvores, desmatamento de áreas protegidas, entre outros.",
	},
	{
		value: "burning",
		label: "Queimadas",
		description:
			"Denúncias relacionadas a incêndios florestais, queimadas ilegais, entre outros.",
	},
	{
		value: "vacant_lot",
		label: "Terreno Baldio",
		description:
			"Denúncias relacionadas à área urbana ou rural sem construções, edificações ou uso ativo, caracterizada pelo abandono, falta de manutenção, vegetação alta e, frequentemente, acúmulo de lixo ou entulho.",
	},
];

export type ComplaintCaptureMode = "photo" | "video";

export type CameraCapturedVideo =
	| {
			uri: string;
	  }
	| undefined;

export type ComplaintCapture = {
	id: string;
	capture: {
		type: ComplaintCaptureMode;
		object: CameraCapturedPicture | CameraCapturedVideo;
	};
	date: string;
	geospatial: {
		heading: Location.LocationHeadingObject;
		location: Location.LocationObject;
		addresses: Location.LocationGeocodedAddress;
	};
	type: ComplaintType;
	observation: string;
	created_at: string;
	updated_at: string;
};

export type ComplaintStatus = "pending" | "resolved" | "canceled";

export type Complaint = ComplaintCapture & {
	status: ComplaintStatus;
};

type Geospatial = {
	heading: {
		trueHeading: number;
		magHeading: number;
		accuracy: number;
	};
	location: {
		coords: {
			latitude: number;
			longitude: number;
			altitude: number | null;
			accuracy: number | null;
			altitudeAccuracy: number | null;
			heading: number | null;
			speed: number | null;
		};
		timestamp: number;
		mocked?: boolean;
	};
	addresses: {
		city: string | null;
		district: string | null;
		streetNumber: string | null;
		street: string | null;
		region: string | null;
		subregion: string | null;
		country: string | null;
		postalCode: string | null;
		name: string | null;
		isoCountryCode: string | null;
		timezone: string | null;
		formattedAddress: string | null;
	};
};
