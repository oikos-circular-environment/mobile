import { View } from "react-native";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { cn } from "@/libs/utils";

export interface SurveyScaleOption {
	value: number;
	label: string;
}

interface SurveyScaleProps {
	options: SurveyScaleOption[];
	value?: number;
	onChange: (value: number) => void;
	className?: string;
}

export function SurveyScale({
	options,
	value,
	onChange,
	className,
}: SurveyScaleProps) {
	return (
		<View className={cn("flex-row justify-between", className)}>
			{options.map(option => {
				const selected = option.value === value;

				return (
					<Pressable
						key={option.value}
						onPress={() => onChange(option.value)}
						className="w-[68px] items-center gap-1.5"
					>
						<View
							className={cn(
								"size-11 items-center justify-center rounded-full border border-border",
								selected && "border-lime-800 bg-lime-800",
							)}
						>
							<Text
								size="md"
								bold
								className={selected ? "text-white" : "text-foreground"}
							>
								{option.value}
							</Text>
						</View>

						<Text size="xs" className="text-center text-muted-foreground">
							{option.label}
						</Text>
					</Pressable>
				);
			})}
		</View>
	);
}
