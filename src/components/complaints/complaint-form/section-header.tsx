import { View } from "react-native";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { cn } from "@/libs/utils";

export type SectionHeaderProps = {
	title: string;
	description: string;
	className?: string;
};

export function SectionHeader({
	title,
	description,
	className,
}: SectionHeaderProps) {
	return (
		<View className={cn("gap-1 pt-1", className)}>
			<Heading size="sm">{title}</Heading>
			<Text className="text-sm text-gray-500">{description}</Text>
		</View>
	);
}
