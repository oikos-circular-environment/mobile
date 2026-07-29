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
		<View className={cn("gap-1.5", className)}>
			<View className="flex-row items-center justify-between">
				<Text size="sm" className="text-muted-foreground">
					{categoryLabel}
				</Text>
				<Text size="sm" className="text-muted-foreground">
					{`${currentIndex}/${totalCount}`}
				</Text>
			</View>

			<Progress value={percentage} className="h-1.5 w-full">
				<ProgressFilledTrack className="bg-lime-800" />
			</Progress>
		</View>
	);
}
