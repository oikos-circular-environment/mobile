import { tva, type VariantProps } from "@gluestack-ui/utils/nativewind-utils";
import { TouchableOpacity, View } from "react-native";
import { Text } from "@/components/ui/text";
import {
	type ComplaintStatus,
	complaintStatuses,
} from "@/libs/types/complaint";
import { cn } from "@/libs/utils";
import {
	type ChipSize,
	COMPLAINT_STATUS_COLORS,
	COMPLAINT_STATUS_LABELS,
	STATUS_SOLID_BG,
	STATUS_SUBTLE_BG,
	STATUS_TEXT_COLOR,
} from "./tokens";

const chipStyle = tva({
	base: "flex-row items-center",
	variants: {
		size: {
			xs: "gap-0.5 rounded px-1.5 py-0.5",
			sm: "gap-1 rounded-md px-2 py-1",
			md: "gap-1 rounded-lg px-3 py-1.5",
			lg: "gap-1.5 rounded-xl px-3.5 py-2",
		},
	},
});

const chipIconOnlyStyle = tva({
	base: "items-center justify-center",
	variants: {
		size: {
			xs: "rounded p-0.5",
			sm: "rounded-md p-1",
			md: "rounded-lg p-1.5",
			lg: "rounded-xl p-2",
		},
	},
});

const chipTextStyle = tva({
	base: "font-semibold",
	variants: {
		size: {
			xs: "text-[10px]",
			sm: "text-[11px]",
			md: "text-[13px]",
			lg: "text-sm",
		},
	},
});

const ICON_SIZES: Record<ChipSize, number> = {
	xs: 10,
	sm: 11,
	md: 13,
	lg: 15,
};

const ICON_STROKE: Record<ChipSize, number> = {
	xs: 2.5,
	sm: 2.5,
	md: 2,
	lg: 2,
};

type BaseProps = VariantProps<typeof chipStyle> & {
	status: ComplaintStatus;
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
}: BaseProps) {
	const statusInfo = complaintStatuses.find(s => s.value === status);
	const Icon = statusInfo?.icon;
	const label = COMPLAINT_STATUS_LABELS[status] ?? status;
	const s = size ?? "md";

	if (iconOnly) {
		return (
			<View
				className={cn(
					chipIconOnlyStyle({ size }),
					STATUS_SUBTLE_BG[status],
					className,
				)}
			>
				{Icon && (
					<Icon
						size={ICON_SIZES[s]}
						color={COMPLAINT_STATUS_COLORS[status]}
						strokeWidth={ICON_STROKE[s]}
					/>
				)}
			</View>
		);
	}

	return (
		<View
			className={cn(chipStyle({ size }), STATUS_SUBTLE_BG[status], className)}
		>
			{showIcon && Icon && (
				<Icon
					size={ICON_SIZES[s]}
					color={COMPLAINT_STATUS_COLORS[status]}
					strokeWidth={ICON_STROKE[s]}
				/>
			)}
			<Text className={cn(chipTextStyle({ size }), STATUS_TEXT_COLOR[status])}>
				{label}
			</Text>
		</View>
	);
}

type PressableProps = Omit<BaseProps, "iconOnly"> & {
	active?: boolean;
	onPress: () => void;
};

function ComplaintStatusChipPressable({
	status,
	size = "md",
	showIcon = true,
	active = false,
	onPress,
	className,
}: PressableProps) {
	const statusInfo = complaintStatuses.find(s => s.value === status);
	const Icon = statusInfo?.icon;
	const label = COMPLAINT_STATUS_LABELS[status] ?? status;
	const s = size ?? "md";

	return (
		<TouchableOpacity
			activeOpacity={0.8}
			onPress={onPress}
			className={cn(
				chipStyle({ size }),
				"shadow",
				active ? STATUS_SOLID_BG[status] : "bg-white",
				className,
			)}
		>
			{showIcon && Icon && (
				<Icon
					size={ICON_SIZES[s]}
					color={active ? "#ffffff" : "#4b5563"}
					strokeWidth={ICON_STROKE[s]}
				/>
			)}
			<Text
				className={cn(
					chipTextStyle({ size }),
					active ? "text-white" : "text-gray-800",
				)}
			>
				{label}
			</Text>
		</TouchableOpacity>
	);
}

ComplaintStatusChipBase.Pressable = ComplaintStatusChipPressable;

export const ComplaintStatusChip = ComplaintStatusChipBase;
