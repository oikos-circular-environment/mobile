import { CircleCheckIcon, CircleIcon } from "lucide-react-native";
import { View } from "react-native";
import { colors } from "@/components/style/colors";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { cn } from "@/libs/utils";

interface OptionRowProps {
	title: string;
	description?: string;
	selected?: boolean;
	onPress: () => void;
	className?: string;
}

export function OptionRow({
	title,
	description,
	selected = false,
	onPress,
	className,
}: OptionRowProps) {
	return (
		<Pressable
			onPress={onPress}
			className={cn(
				"flex-row items-center gap-3 rounded-lg border border-border bg-white p-4",
				selected && "border-lime-300 bg-lime-50",
				className,
			)}
		>
			<View className="flex-1 gap-0.5">
				<Text size="sm" bold>
					{title}
				</Text>
				{description ? (
					<Text size="xs" className="leading-4 text-muted-foreground">
						{description}
					</Text>
				) : null}
			</View>

			{selected ? (
				<CircleCheckIcon size={20} color={colors.lime[700]} />
			) : (
				<CircleIcon size={20} color={colors.gray[300]} />
			)}
		</Pressable>
	);
}
