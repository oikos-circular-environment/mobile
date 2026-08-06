import { FlatList, type FlatListProps } from "react-native";
import { OptionRow } from "@/components/survey/option-row";
import { OptionRowSkeletonList } from "@/components/survey/option-row-skeleton";
import { Text } from "@/components/ui/text";

export interface OptionRowListItem {
	key: string;
	title: string;
	description?: string;
	selected: boolean;
	onPress: () => void;
}

interface OptionRowListProps
	extends Omit<
		FlatListProps<OptionRowListItem>,
		"data" | "renderItem" | "keyExtractor" | "ListEmptyComponent"
	> {
	data: OptionRowListItem[];
	isLoading?: boolean;
	emptyMessage?: string;
}

export function OptionRowList({
	data,
	isLoading = false,
	emptyMessage,
	contentContainerClassName = "gap-2.5",
	className = "flex-1",
	...props
}: OptionRowListProps) {
	return (
		<FlatList
			data={data}
			keyExtractor={item => item.key}
			renderItem={({ item }) => (
				<OptionRow
					title={item.title}
					description={item.description}
					selected={item.selected}
					onPress={item.onPress}
				/>
			)}
			ListEmptyComponent={
				isLoading ? (
					<OptionRowSkeletonList />
				) : emptyMessage ? (
					<Text size="sm" className="text-muted-foreground">
						{emptyMessage}
					</Text>
				) : null
			}
			contentContainerClassName={contentContainerClassName}
			className={className}
			keyboardShouldPersistTaps="handled"
			{...props}
		/>
	);
}
