import { colors } from "@/components/style/colors";
import type { ComplaintStatus, ComplaintType } from "@/libs/types/complaint";

export type ChipSize = "xs" | "sm" | "md" | "lg";

export const COMPLAINT_TYPE_COLORS: Record<ComplaintType, string> = {
	IRREGULAR_DISPOSAL: colors.amber[500],
	DEFORESTATION: colors.lime[600],
	BURNING: colors.red[500],
	VACANT_LOT: colors.gray[500],
};

export const COMPLAINT_STATUS_COLORS: Record<ComplaintStatus, string> = {
	OPEN: colors.sky[500],
	RESOLVED: colors.lime[600],
	CANCELED: colors.red[600],
};

export const COMPLAINT_STATUS_LABELS: Record<ComplaintStatus, string> = {
	OPEN: "Aberta",
	RESOLVED: "Resolvida",
	CANCELED: "Cancelada",
};

export const TYPE_SUBTLE_BG: Record<ComplaintType, string> = {
	IRREGULAR_DISPOSAL: "bg-amber-500/15",
	DEFORESTATION: "bg-lime-600/15",
	BURNING: "bg-red-500/15",
	VACANT_LOT: "bg-gray-500/15",
};

export const TYPE_TEXT_COLOR: Record<ComplaintType, string> = {
	IRREGULAR_DISPOSAL: "text-amber-500",
	DEFORESTATION: "text-lime-600",
	BURNING: "text-red-500",
	VACANT_LOT: "text-gray-500",
};

export const STATUS_SUBTLE_BG: Record<ComplaintStatus, string> = {
	OPEN: "bg-sky-500/15",
	RESOLVED: "bg-lime-600/15",
	CANCELED: "bg-red-600/15",
};

export const STATUS_TEXT_COLOR: Record<ComplaintStatus, string> = {
	OPEN: "text-sky-500",
	RESOLVED: "text-lime-600",
	CANCELED: "text-red-600",
};
