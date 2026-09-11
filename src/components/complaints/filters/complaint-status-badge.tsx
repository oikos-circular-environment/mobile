import { ShieldCheckIcon, ShieldIcon, ShieldXIcon } from "lucide-react-native";
import type React from "react";
import { Text, View } from "react-native";
import { colors } from "@/components/style/colors";
import type { ComplaintStatus } from "@/libs/types/complaint";
import { cn } from "@/libs/utils";

type LucideIcon = React.ComponentType<{
	size?: number;
	color?: string;
	strokeWidth?: number;
}>;

const ICON_MAP: Record<ComplaintStatus, LucideIcon> = {
	OPEN: ShieldIcon,
	RESOLVED: ShieldCheckIcon,
	CANCELED: ShieldXIcon,
};

const BADGE_ICON_COLORS: Record<ComplaintStatus, string> = {
	OPEN: colors.sky[500],
	RESOLVED: colors.lime[600],
	CANCELED: colors.red[600],
};

const BADGE_LABELS: Record<ComplaintStatus, string> = {
	OPEN: "Aberta",
	RESOLVED: "Resolvida",
	CANCELED: "Cancelada",
};

type ChipSize = "xs" | "sm" | "md" | "lg";

const BADGE_CONTAINER: Record<ChipSize, string> = {
	xs: "gap-0.5 rounded px-1.5 py-0.5",
	sm: "gap-1 rounded-md px-2 py-1",
	md: "gap-1 rounded-lg px-3 py-1.5",
	lg: "gap-1.5 rounded-xl px-3.5 py-2",
};

const BADGE_ICON_ONLY: Record<ChipSize, string> = {
	xs: "rounded p-0.5",
	sm: "rounded-md p-1",
	md: "rounded-lg p-1.5",
	lg: "rounded-xl p-2",
};

const BADGE_TEXT: Record<ChipSize, string> = {
	xs: "text-xs",
	sm: "text-xs",
	md: "text-sm",
	lg: "text-sm",
};

const BADGE_ICON_SIZES: Record<ChipSize, number> = {
	xs: 10,
	sm: 11,
	md: 13,
	lg: 15,
};

const BADGE_ICON_STROKE: Record<ChipSize, number> = {
	xs: 2.5,
	sm: 2.5,
	md: 2,
	lg: 2,
};

const BADGE_SUBTLE_BG: Record<ComplaintStatus, string> = {
	OPEN: "bg-sky-500/15",
	RESOLVED: "bg-lime-600/15",
	CANCELED: "bg-red-600/15",
};

const BADGE_TEXT_COLOR: Record<ComplaintStatus, string> = {
	OPEN: "text-sky-500",
	RESOLVED: "text-lime-600",
	CANCELED: "text-red-600",
};

export function getComplaintStatusLabel(status: ComplaintStatus): string {
	return BADGE_LABELS[status];
}

export type ComplaintStatusBadgeProps = {
	status: ComplaintStatus;
	size?: ChipSize;
	showIcon?: boolean;
	iconOnly?: boolean;
	className?: string;
};

export function ComplaintStatusBadge({
	status,
	size = "md",
	showIcon = true,
	iconOnly = false,
	className,
}: ComplaintStatusBadgeProps) {
	const Icon = ICON_MAP[status];

	if (iconOnly) {
		return (
			<View
				className={cn(
					"items-center justify-center",
					BADGE_ICON_ONLY[size],
					BADGE_SUBTLE_BG[status],
					className,
				)}
			>
				<Icon
					size={BADGE_ICON_SIZES[size]}
					color={BADGE_ICON_COLORS[status]}
					strokeWidth={BADGE_ICON_STROKE[size]}
				/>
			</View>
		);
	}

	return (
		<View
			className={cn(
				"flex-row items-center",
				BADGE_CONTAINER[size],
				BADGE_SUBTLE_BG[status],
				className,
			)}
		>
			{showIcon && (
				<Icon
					size={BADGE_ICON_SIZES[size]}
					color={BADGE_ICON_COLORS[status]}
					strokeWidth={BADGE_ICON_STROKE[size]}
				/>
			)}
			<Text
				className={cn(
					"font-semibold",
					BADGE_TEXT[size],
					BADGE_TEXT_COLOR[status],
				)}
			>
				{BADGE_LABELS[status]}
			</Text>
		</View>
	);
}
