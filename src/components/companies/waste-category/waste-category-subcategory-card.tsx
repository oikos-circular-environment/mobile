import { CircleAlertIcon } from "lucide-react-native";
import { Alert, AlertIcon, AlertText } from "@/components/ui/alert";
import { Box } from "@/components/ui/box";
import { Card } from "@/components/ui/card";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { WasteCategoryHazardLevel } from "./waste-category-hazard-level";

export interface WasteCategorySubcategoryCardProps {
	subItem: {
		id: string;
		name: string;
		description: string | null;
		observations: string | null;
		hazard_level: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
		type: "INCLUDE" | "EXCLUDE";
		created_at: Date;
		category_id: string;
	};
}

export function WasteCategorySubcategoryCard({
	subItem,
}: WasteCategorySubcategoryCardProps) {
	return (
		<Card className="shadow-none gap-4">
			<HStack space="md" className="items-center">
				<WasteCategoryHazardLevel hazardLevel={subItem.hazard_level} />
				<Box className="flex-1">
					<Text numberOfLines={2}>{subItem.name}</Text>
				</Box>
			</HStack>
			{subItem.observations && (
				<Alert className="p-1 gap-2 bg-destructive/10 border-destructive/20 items-center">
					<AlertIcon
						as={CircleAlertIcon}
						size={14}
						className="text-destructive/40"
					/>
					<AlertText className="flex-col text-foreground/80">
						{subItem.observations}
					</AlertText>
				</Alert>
			)}
		</Card>
	);
}
