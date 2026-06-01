import { tva, type VariantProps } from "@gluestack-ui/utils/nativewind-utils";
import { TouchableOpacity, View } from "react-native";
import { Text } from "@/components/ui/text";
import { cn } from "@/libs/utils";
import {
	type ComplaintType,
	complaintTypeValues,
} from "@/libs/types/complaint";
import {
	COMPLAINT_TYPE_COLORS,
	TYPE_SOLID_BG,
	TYPE_SUBTLE_BG,
	TYPE_TEXT_COLOR,
	type ChipSize,
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
	type: ComplaintType;
	showIcon?: boolean;
	className?: string;
};

function ComplaintTypeChipBase({
	type,
	size = "md",
	showIcon = true,
	className,
}: BaseProps) {
	const typeInfo = complaintTypeValues.find(t => t.value === type);
	const Icon = typeInfo?.icon;
	const s = size ?? "md";

	return (
		<View className={cn(chipStyle({ size }), TYPE_SUBTLE_BG[type], className)}>
			{showIcon && Icon && (
				<Icon
					size={ICON_SIZES[s]}
					color={COMPLAINT_TYPE_COLORS[type]}
					strokeWidth={ICON_STROKE[s]}
				/>
			)}
			<Text className={cn(chipTextStyle({ size }), TYPE_TEXT_COLOR[type])}>
				{typeInfo?.label ?? type}
			</Text>
		</View>
	);
}

type PressableProps = BaseProps & {
	active?: boolean;
	onPress: () => void;
};

function ComplaintTypeChipPressable({
	type,
	size = "md",
	showIcon = true,
	active = false,
	onPress,
	className,
}: PressableProps) {
	const typeInfo = complaintTypeValues.find(t => t.value === type);
	const Icon = typeInfo?.icon;
	const s = size ?? "md";

	return (
		<TouchableOpacity
			activeOpacity={0.8}
			onPress={onPress}
			className={cn(
				chipStyle({ size }),
				"shadow",
				active ? TYPE_SOLID_BG[type] : "bg-white",
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
				{typeInfo?.label ?? type}
			</Text>
		</TouchableOpacity>
	);
}

ComplaintTypeChipBase.Pressable = ComplaintTypeChipPressable;

export const ComplaintTypeChip = ComplaintTypeChipBase;
