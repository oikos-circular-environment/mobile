import { ChevronRightIcon } from "lucide-react-native";
import type { ComponentType } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { colors } from "@/components/style/colors";
import { Text } from "@/components/ui/text";
import { cn } from "@/libs/utils";

type SettingOptionTone = "default" | "neutral" | "danger" | "warning";

const toneStyles: Record<
	SettingOptionTone,
	{ container: string; iconBox: string; title: string; description: string }
> = {
	default: {
		container: "bg-gray-50 active:bg-gray-100",
		iconBox: "bg-lime-800",
		title: "text-gray-900",
		description: "text-gray-500",
	},
	neutral: {
		container: "bg-gray-50 active:bg-gray-100",
		iconBox: "bg-gray-700",
		title: "text-gray-700",
		description: "text-gray-500",
	},
	danger: {
		container: "bg-red-50 active:bg-red-100",
		iconBox: "bg-red-600",
		title: "text-red-600",
		description: "text-red-700",
	},
	warning: {
		container: "bg-amber-50 active:bg-amber-100",
		iconBox: "bg-amber-600",
		title: "text-amber-700",
		description: "text-amber-600",
	},
};

type SettingOptionRowProps = {
	icon: ComponentType<{ size: number; color: string }>;
	title: string;
	description?: string;
	tone?: SettingOptionTone;
	showChevron?: boolean;
	isLoading?: boolean;
	onPress: () => void;
	testID?: string;
};

export function SettingOptionRow({
	icon: Icon,
	title,
	description,
	tone = "default",
	showChevron = false,
	isLoading = false,
	onPress,
	testID,
}: SettingOptionRowProps) {
	const styles = toneStyles[tone];

	return (
		<Pressable
			testID={testID}
			className={cn(
				"flex-row items-center gap-3 p-4 rounded-xl",
				styles.container,
			)}
			onPress={onPress}
			disabled={isLoading}
		>
			<View
				className={cn(
					"w-8 h-8 rounded-lg items-center justify-center",
					styles.iconBox,
				)}
			>
				{isLoading ? (
					<ActivityIndicator size="small" color={colors.white} />
				) : (
					<Icon size={16} color={colors.white} />
				)}
			</View>
			<View className="flex-1">
				<Text className={cn("font-semibold", styles.title)}>{title}</Text>
				{description && (
					<Text className={cn("text-xs", styles.description)}>
						{description}
					</Text>
				)}
			</View>
			{showChevron && <ChevronRightIcon size={16} color={colors.gray[400]} />}
		</Pressable>
	);
}
