import { View } from "react-native";
import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

export interface SurveyTourTooltipProps {
	text: string;
	stepIndex: number;
	stepCount: number;
	isLast: boolean;
	onNext: () => void;
	onSkip: () => void;
}

export function SurveyTourTooltip({
	text,
	stepIndex,
	stepCount,
	isLast,
	onNext,
	onSkip,
}: SurveyTourTooltipProps) {
	return (
		<View className="w-[85%] max-w-[280px] gap-3 rounded-lg bg-lime-900 p-4">
			<Text className="text-white" size="sm">
				{text}
			</Text>
			<Text className="text-lime-300" size="xs">
				{stepIndex + 1}/{stepCount}
			</Text>
			<View className="flex-row justify-between gap-2">
				<Button
					variant="outline"
					className="flex-1 border-white/30 bg-transparent"
					onPress={onSkip}
				>
					<ButtonText className="text-white text-sm">Pular</ButtonText>
				</Button>
				<Button className="flex-1 bg-lime-800" onPress={onNext}>
					<ButtonText className="text-sm">
						{isLast ? "Concluir" : "Próximo"}
					</ButtonText>
				</Button>
			</View>
		</View>
	);
}
