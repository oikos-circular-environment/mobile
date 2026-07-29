import { ChevronRightIcon } from "lucide-react-native";
import { View } from "react-native";
import { colors } from "@/components/style/colors";
import { Divider } from "@/components/ui/divider";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { cn } from "@/libs/utils";

interface FloatingIndicatorProps {
	completedCount: number;
	totalCount: number;
	elapsedLabel: string;
	onPress: () => void;
	className?: string;
}

export function FloatingIndicator({
	completedCount,
	totalCount,
	elapsedLabel,
	onPress,
	className,
}: FloatingIndicatorProps) {
	return (
		<Pressable
			onPress={onPress}
			className={cn(
				"flex-row items-center gap-2 rounded-full bg-background px-3 py-2 shadow-md",
				className,
			)}
		>
			<Text size="xs" bold>
				{`${completedCount}/${totalCount}`}
			</Text>

			<Divider orientation="vertical" className="h-3.5" />

			<Text size="xs" className="text-muted-foreground">
				{elapsedLabel}
			</Text>

			<View className="size-5 items-center justify-center">
				<ChevronRightIcon size={14} color={colors.gray[400]} />
			</View>
		</Pressable>
	);
}
