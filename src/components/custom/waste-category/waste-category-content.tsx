import { CircleAlertIcon, InfoIcon } from "lucide-react-native";
import { Alert, AlertIcon, AlertText } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import type {
	WasteCategoryHazardLevel,
	WasteCategorySubcategory,
} from "@/libs/types/waste-category";
import { useWasteCategoryContext } from "./context";
import { WasteCategoryCaption } from "./waste-category-caption";
import {
	type HazardLevelVariant,
	WasteCategoryHazardLevel as WasteCategoryHazardLevelComponent,
} from "./waste-category-hazard-level";
import { WasteCategorySubcategoryCard } from "./waste-category-subcategory-card";

export function WasteCategoryContent() {
	const { selectedWasteCategory } = useWasteCategoryContext();

	if (!selectedWasteCategory) return null;

	return (
		<VStack space="md">
			<Text size="sm" className="font-semibold text-muted-foreground">
				Grau de periculosidade geral
			</Text>
			<Card className="shadow-none gap-2">
				<HStack className="gap-2">
					{selectedWasteCategory?.hazard_levels.map(
						(hazard_level: WasteCategoryHazardLevel) => (
							<WasteCategoryHazardLevelComponent
								key={`${selectedWasteCategory.id}-${hazard_level}`}
								variant={hazard_level.toLowerCase() as HazardLevelVariant}
							/>
						),
					)}
				</HStack>
			</Card>

			{selectedWasteCategory?.description && (
				<Alert className="gap-2 bg-sky-100 border-sky-400">
					<AlertIcon as={InfoIcon} className="text-sky-400" />
					<AlertText className="text-foreground/80">
						{selectedWasteCategory.description}
					</AlertText>
				</Alert>
			)}

			{selectedWasteCategory?.observations && (
				<Alert className="gap-2 bg-destructive/10 border-destructive/20">
					<AlertIcon as={CircleAlertIcon} className="text-destructive/40" />
					<AlertText className="flex-col text-foreground/80">
						{selectedWasteCategory.observations}
					</AlertText>
				</Alert>
			)}

			<Text size="sm" className="font-semibold text-muted-foreground">
				Itens incluídos
			</Text>
			{selectedWasteCategory?.subcategories
				.filter(
					(subItem: WasteCategorySubcategory) => subItem.type === "INCLUDE",
				)
				.map((subItem: WasteCategorySubcategory) => (
					<WasteCategorySubcategoryCard key={subItem.id} subItem={subItem} />
				))}

			{selectedWasteCategory?.subcategories.some(
				(subItem: WasteCategorySubcategory) => subItem.type === "EXCLUDE",
			) && (
				<Text size="sm" className="font-semibold text-muted-foreground">
					Itens excluídos
				</Text>
			)}

			{selectedWasteCategory?.subcategories
				.filter(
					(subItem: WasteCategorySubcategory) => subItem.type === "EXCLUDE",
				)
				.map((subItem: WasteCategorySubcategory) => (
					<WasteCategorySubcategoryCard key={subItem.id} subItem={subItem} />
				))}

			<WasteCategoryCaption />
		</VStack>
	);
}
