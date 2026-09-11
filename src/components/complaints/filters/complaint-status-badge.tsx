import { ShieldCheckIcon, ShieldIcon, ShieldXIcon } from "lucide-react-native";
import type React from "react";
import { View } from "react-native";
import { colors } from "@/components/style/colors";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
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

const BADGE_LABELS: Record<ComplaintStatus, string> = {
	OPEN: "Aberta",
	RESOLVED: "Resolvida",
	CANCELED: "Cancelada",
};

type ChipSize = "xs" | "sm" | "md" | "lg";

const SIZE_CONTAINER: Record<ChipSize, string> = {
	xs: "gap-0.5 px-1.5 py-0.5",
	sm: "gap-1 px-2 py-1",
	md: "gap-1 px-3 py-1.5",
	lg: "gap-1.5 px-3.5 py-2",
};

const SIZE_ICON_ONLY: Record<ChipSize, string> = {
	xs: "rounded p-0.5",
	sm: "rounded-md p-1",
	md: "rounded-lg p-1.5",
	lg: "rounded-xl p-2",
};

const SIZE_TEXT: Record<ChipSize, string> = {
	xs: "text-xs",
	sm: "text-xs",
	md: "text-sm",
	lg: "text-sm",
};

const SIZE_ICON: Record<ChipSize, number> = {
	xs: 10,
	sm: 11,
	md: 13,
	lg: 15,
};

const SIZE_ICON_STROKE: Record<ChipSize, number> = {
	xs: 2.5,
	sm: 2.5,
	md: 2,
	lg: 2,
};

const BADGE_BG: Record<ComplaintStatus, string> = {
	OPEN: "bg-sky-100",
	RESOLVED: "bg-lime-100",
	CANCELED: "bg-red-100",
};

const BADGE_TEXT_COLOR: Record<ComplaintStatus, string> = {
	OPEN: "text-sky-600",
	RESOLVED: "text-lime-600",
	CANCELED: "text-red-600",
};

const BADGE_ICON_COLORS: Record<ComplaintStatus, string> = {
	OPEN: colors.sky[600],
	RESOLVED: colors.lime[600],
	CANCELED: colors.red[600],
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
					SIZE_ICON_ONLY[size],
					BADGE_BG[status],
					className,
				)}
			>
				<Icon
					size={SIZE_ICON[size]}
					strokeWidth={SIZE_ICON_STROKE[size]}
					color={BADGE_ICON_COLORS[status]}
				/>
			</View>
		);
	}

	return (
		<Badge
			variant="soft"
			className={cn(SIZE_CONTAINER[size], BADGE_BG[status], className)}
		>
			{showIcon && (
				<BadgeIcon
					as={Icon}
					className={BADGE_TEXT_COLOR[status]}
					size={SIZE_ICON[size]}
				/>
			)}
			<BadgeText className={cn(SIZE_TEXT[size], BADGE_TEXT_COLOR[status])}>
				{BADGE_LABELS[status]}
			</BadgeText>
		</Badge>
	);
}
