import { Pressable, ScrollView, View } from "react-native";
import { Text } from "@/components/ui/text";
import { cn } from "@/libs/utils";
import { useWasteCategoryContext } from "./context";

export function WasteCategoryChips() {
	const {
		categories,
		selectionMode,
		selectedWasteCategory,
		selectedWasteCategories,
		onSelect,
	} = useWasteCategoryContext();

	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerClassName="gap-2 py-0.5"
		>
			{categories.map(category => {
				const isSelected =
					selectionMode === "multiple"
						? selectedWasteCategories.some(c => c.id === category.id)
						: category.id === selectedWasteCategory?.id;

				return (
					<Pressable key={category.id} onPress={() => onSelect(category)}>
						<View
							className={cn(
								"px-4 py-2 rounded-xl border",
								isSelected
									? "bg-lime-800 border-lime-800"
									: "bg-white border-border",
							)}
						>
							<Text
								className={cn(
									"text-sm font-medium",
									isSelected && "text-white",
								)}
							>
								{category.name}
							</Text>
						</View>
					</Pressable>
				);
			})}
		</ScrollView>
	);
}
