import { ScrollView, View } from "react-native";
import {
	type HazardLevelVariant,
	WasteCategory,
	WasteCategoryChip,
	WasteCategoryChips,
	WasteCategoryChipText,
	WasteCategoryContent,
	WasteCategoryHazardLevel,
	WasteCategoryHazardLevelIcon,
} from "@/components/custom/waste-category";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import type { WasteCategory as WasteCategoryModel } from "@/libs/types/waste-category";

export type WasteCategorySelectorProps = {
	defaultCategoryIds?: string[];
	onSelectionChange: (categoryIds: string[]) => void;
};

export function WasteCategorySelector({
	defaultCategoryIds,
	onSelectionChange,
}: WasteCategorySelectorProps) {
	return (
		<View className="gap-2 pt-1">
			<Heading size="sm">Categorias identificadas</Heading>
			<Text className="text-sm text-gray-500">
				Selecione os tipos de resíduos que você consegue identificar no local.
			</Text>
			<WasteCategory
				selectionMode="multiple"
				defaultCategoryIds={defaultCategoryIds}
				onSelectionChange={(categories: WasteCategoryModel[]) =>
					onSelectionChange(categories.map(c => c.id))
				}
			>
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerClassName="gap-2 py-0.5"
				>
					<WasteCategoryChips>
						{category => (
							<WasteCategoryChip key={category.id} category={category}>
								<WasteCategoryChipText>{category.name}</WasteCategoryChipText>
								{category.hazard_levels.map(hazard => (
									<WasteCategoryHazardLevel
										key={hazard}
										variant={hazard.toLowerCase() as HazardLevelVariant}
									>
										<WasteCategoryHazardLevelIcon />
									</WasteCategoryHazardLevel>
								))}
							</WasteCategoryChip>
						)}
					</WasteCategoryChips>
				</ScrollView>
				<WasteCategoryContent />
			</WasteCategory>
		</View>
	);
}
