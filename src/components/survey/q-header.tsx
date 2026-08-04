import { View } from "react-native";
import { Progress, ProgressFilledTrack } from "@/components/ui/progress";
import { Text } from "@/components/ui/text";
import { cn } from "@/libs/utils";

interface QHeaderProps {
	categoryLabel: string;
	currentIndex: number;
	totalCount: number;
	className?: string;
}

export function QHeader({
	categoryLabel,
	currentIndex,
	totalCount,
	className,
}: QHeaderProps) {
	const percentage =
		totalCount > 0 ? Math.round((currentIndex / totalCount) * 100) : 0;

	return (
		<View className={cn("gap-2", className)}>
			<View className="flex-row items-center justify-between">
				<Text size="xs" bold className="uppercase tracking-wider text-lime-700">
					{categoryLabel}
				</Text>
				<Text size="xs" className="text-muted-foreground">
					{`${currentIndex}/${totalCount}`}
				</Text>
			</View>

			<Progress value={percentage} className="h-1.5 w-full bg-lime-100">
				<ProgressFilledTrack className="bg-lime-700" />
			</Progress>
		</View>
	);
}
