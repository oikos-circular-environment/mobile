import { GripVerticalIcon } from "lucide-react-native";
import { View } from "react-native";
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
				"flex-row items-center gap-2 rounded-full bg-lime-900 py-2 pl-3.5 pr-2 shadow-md",
				className,
			)}
		>
			<Text size="xs" bold className="text-white">
				{`${completedCount}/${totalCount}`}
			</Text>

			<Divider orientation="vertical" className="h-3.5 bg-white/25" />

			<Text size="xs" className="text-white/80">
				{elapsedLabel}
			</Text>

			<View className="size-5 items-end justify-center">
				<GripVerticalIcon size={16} color="#e5e7eb" />
			</View>
		</Pressable>
	);
}
