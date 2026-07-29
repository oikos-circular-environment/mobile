import { CheckIcon } from "lucide-react-native";
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
				"flex-row items-center justify-between gap-3 py-3",
				className,
			)}
		>
			<View className="flex-1">
				<Text size="sm" bold>
					{title}
				</Text>
				{description ? (
					<Text size="xs" className="text-muted-foreground">
						{description}
					</Text>
				) : null}
			</View>

			<View className={cn("size-5", !selected && "opacity-0")}>
				<CheckIcon size={20} color={colors.lime[800]} />
			</View>
		</Pressable>
	);
}
