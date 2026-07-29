import { View } from "react-native";
import { Progress, ProgressFilledTrack } from "@/components/ui/progress";
import { Text } from "@/components/ui/text";
import { cn } from "@/libs/utils";

interface SurveyProgressProps {
	currentStep: number;
	totalSteps: number;
	className?: string;
}

export function SurveyProgress({
	currentStep,
	totalSteps,
	className,
}: SurveyProgressProps) {
	const percentage =
		totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0;

	return (
		<View className={cn("gap-2", className)}>
			<View className="flex-row items-center justify-between">
				<Text size="sm" className="text-muted-foreground">
					{`Etapa ${currentStep} de ${totalSteps}`}
				</Text>
				<Text size="sm" className="text-muted-foreground">
					{`${percentage}%`}
				</Text>
			</View>

			<Progress value={percentage} className="w-full">
				<ProgressFilledTrack className="bg-lime-800" />
			</Progress>
		</View>
	);
}
