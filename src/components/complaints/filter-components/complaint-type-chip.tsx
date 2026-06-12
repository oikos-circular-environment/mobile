import { Text, View } from "react-native";
import {
	type ComplaintType,
	complaintTypeValues,
} from "@/libs/types/complaint";
import { cn } from "@/libs/utils";
import {
	type ChipSize,
	COMPLAINT_TYPE_COLORS,
	TYPE_SUBTLE_BG,
	TYPE_TEXT_COLOR,
} from "./tokens";

const CHIP_CONTAINER: Record<ChipSize, string> = {
	xs: "gap-0.5 rounded px-1.5 py-0.5",
	sm: "gap-1 rounded-md px-2 py-1",
	md: "gap-1 rounded-lg px-3 py-1.5",
	lg: "gap-1.5 rounded-xl px-3.5 py-2",
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

type ComplaintTypeChipProps = {
	type: ComplaintType;
	size?: ChipSize;
	showIcon?: boolean;
	className?: string;
};

export function ComplaintTypeChip({
	type,
	size = "md",
	showIcon = true,
	className,
}: ComplaintTypeChipProps) {
	const typeInfo = complaintTypeValues.find(t => t.value === type);
	const Icon = typeInfo?.icon;

	return (
		<View
			className={cn(
				"flex-row items-center",
				CHIP_CONTAINER[size],
				TYPE_SUBTLE_BG[type],
				className,
			)}
		>
			{showIcon && Icon && (
				<Icon
					size={ICON_SIZES[size]}
					color={COMPLAINT_TYPE_COLORS[type]}
					strokeWidth={ICON_STROKE[size]}
				/>
			)}
			<Text
				className={cn("font-semibold", CHIP_TEXT[size], TYPE_TEXT_COLOR[type])}
			>
				{typeInfo?.label ?? type}
			</Text>
		</View>
	);
}

export type { ComplaintTypeChipProps };
