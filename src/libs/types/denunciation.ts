import type {
	GetV1DenunciationsByIdResponses,
	GetV1DenunciationsResponses,
	PostV1DenunciationsData,
} from "@oikos-circular-environment/oikos-sdk";
import { AlertTriangle, Flame, ShieldAlert, Siren } from "lucide-react-native";
import type { ValueMapping } from "./value-mapping";

// SDK-derived types
export type Denunciation =
	GetV1DenunciationsResponses[200]["denunciations"][number];
export type DenunciationDetail =
	GetV1DenunciationsByIdResponses[200]["denunciation"];
export type DenunciationAttachment = Denunciation["attachments"][number];
export type DenunciationStatus = Denunciation["status"];
export type DenunciationSeverity = Denunciation["severity"];

export type CreateDenunciationBody = PostV1DenunciationsData["body"];

export const denunciationSeverityOptions: ValueMapping<DenunciationSeverity>[] =
	[
		{ value: "LOW", label: "Baixa", icon: AlertTriangle },
		{ value: "MEDIUM", label: "Média", icon: ShieldAlert },
		{ value: "HIGH", label: "Alta", icon: Flame },
		{ value: "CRITICAL", label: "Crítica", icon: Siren },
	];
