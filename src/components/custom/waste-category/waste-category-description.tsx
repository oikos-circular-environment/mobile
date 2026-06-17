import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { useWasteCategoryContext } from "./context";

export function WasteCategoryDescription() {
	const { selectedWasteCategory } = useWasteCategoryContext();

	if (!selectedWasteCategory?.description) return null;

	return (
		<Card className="shadow-none bg-secondary/40 p-3">
			<Text className="text-sm text-muted-foreground">
				{selectedWasteCategory.description}
			</Text>
		</Card>
	);
}
