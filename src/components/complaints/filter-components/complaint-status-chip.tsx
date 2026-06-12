import {
	useStyleContext,
	withStyleContext,
} from "@gluestack-ui/utils/nativewind-utils";
import { ShieldCheckIcon, ShieldIcon, ShieldXIcon } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";
import {
	type ComplaintStatus,
	complaintStatuses,
} from "@/libs/types/complaint";
import { cn } from "@/libs/utils";
import {
	type ChipSize,
	COMPLAINT_STATUS_COLORS,
	COMPLAINT_STATUS_LABELS,
	STATUS_SUBTLE_BG,
	STATUS_TEXT_COLOR,
} from "./tokens";

const CHIP_CONTAINER: Record<ChipSize, string> = {
	xs: "gap-0.5 rounded px-1.5 py-0.5",
	sm: "gap-1 rounded-md px-2 py-1",
	md: "gap-1 rounded-lg px-3 py-1.5",
	lg: "gap-1.5 rounded-xl px-3.5 py-2",
};

const CHIP_ICON_ONLY: Record<ChipSize, string> = {
	xs: "rounded p-0.5",
	sm: "rounded-md p-1",
	md: "rounded-lg p-1.5",
	lg: "rounded-xl p-2",
};

const CHIP_TEXT: Record<ChipSize, string> = {
	xs: "text-[10px]",
	sm: "text-[11px]",
	md: "text-[13px]",
	lg: "text-sm",
};

const ICON_SIZES: Record<ChipSize, number> = { xs: 10, sm: 11, md: 13, lg: 15 };
const ICON_STROKE: Record<ChipSize, number> = {
	xs: 2.5,
	sm: 2.5,
	md: 2,
	lg: 2,
};

// ─── Base (display chip) ──────────────────────────────────────────────────────

type ComplaintStatusChipProps = {
	status: ComplaintStatus;
	size?: ChipSize;
	showIcon?: boolean;
	iconOnly?: boolean;
	className?: string;
};

function ComplaintStatusChipBase({
	status,
	size = "md",
	showIcon = true,
	iconOnly = false,
	className,
}: ComplaintStatusChipProps) {
	const statusInfo = complaintStatuses.find(s => s.value === status);
	const Icon = statusInfo?.icon;
	const label = COMPLAINT_STATUS_LABELS[status] ?? status;

	if (iconOnly) {
		return (
			<View
				className={cn(
					"items-center justify-center",
					CHIP_ICON_ONLY[size],
					STATUS_SUBTLE_BG[status],
					className,
				)}
			>
				{Icon && (
					<Icon
						size={ICON_SIZES[size]}
						color={COMPLAINT_STATUS_COLORS[status]}
						strokeWidth={ICON_STROKE[size]}
					/>
				)}
			</View>
		);
	}

	return (
		<View
			className={cn(
				"flex-row items-center",
				CHIP_CONTAINER[size],
				STATUS_SUBTLE_BG[status],
				className,
			)}
		>
			{showIcon && Icon && (
				<Icon
					size={ICON_SIZES[size]}
					color={COMPLAINT_STATUS_COLORS[status]}
					strokeWidth={ICON_STROKE[size]}
				/>
			)}
			<Text
				className={cn(
					"font-semibold",
					CHIP_TEXT[size],
					STATUS_TEXT_COLOR[status],
				)}
			>
				{label}
			</Text>
		</View>
	);
}

// ─── Pressable ────────────────────────────────────────────────────────────────

export type ComplaintStatusPressableVariant = ComplaintStatus | "all";

const PRESSABLE_SCOPE = "COMPLAINT_STATUS_CHIP_PRESSABLE";
const PressableContextView = withStyleContext(View, PRESSABLE_SCOPE);

const PRESSABLE_LABELS: Record<ComplaintStatusPressableVariant, string> = {
	all: "Todos",
	OPEN: "Aberta",
	RESOLVED: "Resolvida",
	CANCELED: "Cancelada",
};

const PRESSABLE_SELECTED_CONTAINER: Record<
	ComplaintStatusPressableVariant,
	string
> = {
	all: "bg-lime-800 border-lime-800",
	OPEN: "bg-sky-500 border-sky-500",
	RESOLVED: "bg-lime-600 border-lime-600",
	CANCELED: "bg-red-600 border-red-600",
};

type LucideIcon = React.ComponentType<{
	size?: number;
	color?: string;
	strokeWidth?: number;
}>;

const PRESSABLE_ICON_MAP: Record<ComplaintStatus, LucideIcon> = {
	OPEN: ShieldIcon,
	RESOLVED: ShieldCheckIcon,
	CANCELED: ShieldXIcon,
};

type IComplaintStatusChipPressableProps = Omit<
	React.ComponentPropsWithoutRef<typeof Pressable>,
	"children"
> & {
	variant: ComplaintStatusPressableVariant;
	selected?: boolean;
	className?: string;
	children?: React.ReactNode;
};

function ComplaintStatusChipPressable({
	variant,
	selected = false,
	children,
	className,
	onPress,
	...props
}: IComplaintStatusChipPressableProps) {
	return (
		<Pressable onPress={onPress} {...props}>
			<PressableContextView
				className={cn(
					"flex-row items-center gap-1 border rounded-lg px-4 py-2",
					selected
						? PRESSABLE_SELECTED_CONTAINER[variant]
						: "bg-white border-border",
					className,
				)}
				context={{ variant, selected }}
			>
				{children ??
					(variant === "all" ? (
						<ComplaintStatusChipPressableText />
					) : (
						<>
							<ComplaintStatusChipPressableIcon />
							<ComplaintStatusChipPressableText />
						</>
					))}
			</PressableContextView>
		</Pressable>
	);
}

// ─── Pressable Icon ───────────────────────────────────────────────────────────

type IComplaintStatusChipPressableIconProps = { size?: number };

export const ComplaintStatusChipPressableIcon = React.forwardRef<
	View,
	IComplaintStatusChipPressableIconProps
>(function ComplaintStatusChipPressableIcon({ size = 12 }, _ref) {
	const { variant: parentVariant, selected: parentSelected } =
		useStyleContext(PRESSABLE_SCOPE);
	if (parentVariant === "all") return null;
	const Icon = PRESSABLE_ICON_MAP[parentVariant as ComplaintStatus];
	const color = parentSelected
		? "#ffffff"
		: COMPLAINT_STATUS_COLORS[parentVariant as ComplaintStatus];
	return <Icon size={size} color={color} strokeWidth={2.5} />;
});

// ─── Pressable Text ───────────────────────────────────────────────────────────

type IComplaintStatusChipPressableTextProps = React.ComponentPropsWithoutRef<
	typeof Text
>;

export const ComplaintStatusChipPressableText = React.forwardRef<
	React.ElementRef<typeof Text>,
	IComplaintStatusChipPressableTextProps
>(function ComplaintStatusChipPressableText(
	{ children, className, ...props },
	ref,
) {
	const { variant: parentVariant, selected: parentSelected } =
		useStyleContext(PRESSABLE_SCOPE);
	const colorClass = parentSelected ? "text-white" : "text-gray-400";
	return (
		<Text
			ref={ref}
			className={cn("text-xs font-semibold", colorClass, className)}
			{...props}
		>
			{children ??
				PRESSABLE_LABELS[parentVariant as ComplaintStatusPressableVariant]}
		</Text>
	);
});

ComplaintStatusChipPressable.displayName = "ComplaintStatusChipPressable";
ComplaintStatusChipPressableIcon.displayName =
	"ComplaintStatusChipPressableIcon";
ComplaintStatusChipPressableText.displayName =
	"ComplaintStatusChipPressableText";

ComplaintStatusChipBase.Pressable = ComplaintStatusChipPressable;

export const ComplaintStatusChip = ComplaintStatusChipBase;

export type {
	ComplaintStatusChipProps,
	IComplaintStatusChipPressableProps as ComplaintStatusChipPressableProps,
};
