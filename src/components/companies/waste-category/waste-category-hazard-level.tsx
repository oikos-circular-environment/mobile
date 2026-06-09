import {
	ChevronDownIcon,
	ChevronsUpIcon,
	ChevronUpIcon,
	MinusIcon,
} from "lucide-react-native";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";

export interface WasteCategoryHazardLevelProps {
	hazardLevel: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
}

export function WasteCategoryHazardLevel({
	hazardLevel,
}: WasteCategoryHazardLevelProps) {
	switch (hazardLevel) {
		case "LOW":
			return (
				<Badge
					variant="secondary"
					className="gap-1 bg-lime-50 border border-lime-200"
				>
					<BadgeIcon as={ChevronDownIcon} className="text-lime-600 stroke-3" />
					<BadgeText className="text-lime-600 font-semibold">Baixa</BadgeText>
				</Badge>
			);
		case "MEDIUM":
			return (
				<Badge
					variant="secondary"
					className="gap-1 bg-yellow-50 border border-yellow-200"
				>
					<BadgeIcon as={MinusIcon} className="text-yellow-600 stroke-3" />
					<BadgeText className="text-yellow-600 font-semibold">Média</BadgeText>
				</Badge>
			);
		case "HIGH":
			return (
				<Badge
					variant="secondary"
					className="gap-1 bg-orange-50 border border-orange-200"
				>
					<BadgeIcon as={ChevronUpIcon} className="text-orange-600 stroke-3" />
					<BadgeText className="text-orange-600 font-semibold">Alta</BadgeText>
				</Badge>
			);
		case "VERY_HIGH":
			return (
				<Badge
					variant="secondary"
					className="gap-1 bg-red-50 border border-red-200"
				>
					<BadgeIcon as={ChevronsUpIcon} className="text-red-600 stroke-3" />
					<BadgeText className="text-red-600 font-semibold">
						Muito alta
					</BadgeText>
				</Badge>
			);
		default:
			return (
				<Badge variant="secondary">
					<BadgeText>Desconhecido</BadgeText>
				</Badge>
			);
	}
}
