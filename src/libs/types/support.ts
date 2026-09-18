import type {
	GetV1SupportByIdResponses,
	GetV1SupportResponses,
	PostV1SupportData,
} from "@oikos-circular-environment/oikos-sdk";
import { LifeBuoy, ShieldAlert, Sparkles } from "lucide-react-native";
import type { ValueMapping } from "./value-mapping";

// SDK-derived types
export type SupportRequest = GetV1SupportResponses[200]["supports"][number];
export type SupportRequestDetail = GetV1SupportByIdResponses[200]["support"];
export type SupportRequestAttachment = SupportRequest["attachments"][number];
export type SupportRequestType = SupportRequest["type"];
export type SupportRequestStatus = SupportRequest["status"];

export type CreateSupportRequestBody = PostV1SupportData["body"];
export type SupportEnvironment = NonNullable<
	CreateSupportRequestBody["environment"]
>;
export type SupportLastError = NonNullable<SupportEnvironment["last_error"]>;

export const supportTypeOptions: ValueMapping<SupportRequestType>[] = [
	{ value: "ERROR", label: "Erro", icon: ShieldAlert },
	{ value: "SUPPORT", label: "Suporte", icon: LifeBuoy },
	{ value: "IMPROVEMENT", label: "Melhoria", icon: Sparkles },
];
