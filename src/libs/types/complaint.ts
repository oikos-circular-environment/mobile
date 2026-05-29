import type { CameraCapturedPicture } from "expo-camera";
import {
	FlameIcon,
	ShieldAlertIcon,
	ShieldCheckIcon,
	ShieldIcon,
	ShieldQuestionMarkIcon,
	ShieldXIcon,
	ShrubIcon,
	TractorIcon,
	Trash2Icon,
} from "lucide-react-native";
import type { ValueMapping } from "./value-mapping";
// import type * as Location from "expo-location";

export type ComplaintType =
	| "IRREGULAR_DISPOSAL"
	| "DEFORESTATION"
	| "BURNING"
	| "VACANT_LOT";

export const complaintTypeValues: ValueMapping<ComplaintType>[] = [
	{
		value: "IRREGULAR_DISPOSAL",
		label: "Descarte Irregular",
		description:
			"Denúncias relacionadas ao descarte inadequado de resíduos, como lixo, entulho, pneus, animais mortos, entre outros.",
		icon: Trash2Icon,
	},
	{
		value: "DEFORESTATION",
		label: "Desmatamento",
		description:
			"Denúncias relacionadas à remoção ilegal de vegetação, como corte de árvores, desmatamento de áreas protegidas, entre outros.",
		icon: TractorIcon,
	},
	{
		value: "BURNING",
		label: "Queimadas",
		description:
			"Denúncias relacionadas a incêndios florestais, queimadas ilegais, entre outros.",
		icon: FlameIcon,
	},
	{
		value: "VACANT_LOT",
		label: "Terreno Baldio",
		description:
			"Denúncias relacionadas à área urbana ou rural sem construções, edificações ou uso ativo, caracterizada pelo abandono, falta de manutenção, vegetação alta e, frequentemente, acúmulo de lixo ou entulho.",
		icon: ShrubIcon,
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
	geospatial: Geospatial;
	type: ComplaintType;
	observation: string;
	created_at: string;
	updated_at: string;
};

export type ComplaintStatus =
	| "OPEN"
	| "IN_PROGRESS"
	| "RESOLVED"
	| "REJECTED"
	| "CANCELED";

export type Complaint = ComplaintCapture & {
	status: ComplaintStatus;
};

export const complaintStatuses: ValueMapping<ComplaintStatus>[] = [
	{
		value: "OPEN",
		label: "Aberto",
		icon: ShieldIcon,
	},
	{
		value: "IN_PROGRESS",
		label: "Em andamento",
		icon: ShieldQuestionMarkIcon,
	},
	{
		value: "RESOLVED",
		label: "Resolvidos",
		icon: ShieldCheckIcon,
	},
	{
		value: "CANCELED",
		label: "Aberto",
		icon: ShieldXIcon,
	},
	{
		value: "REJECTED",
		label: "Aberto",
		icon: ShieldAlertIcon,
	},
];

export type Geospatial = {
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
