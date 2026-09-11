import {
	ChevronDownIcon,
	ChevronsUpIcon,
	ChevronUpIcon,
	MinusIcon,
	RadarIcon,
	RadiationIcon,
	RecycleIcon,
	SearchIcon,
	Settings2Icon,
	ShieldCheckIcon,
	ShieldIcon,
} from "lucide-react-native";
import type React from "react";
import { ScrollView, TouchableOpacity } from "react-native";
import { colors } from "@/components/style/colors";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { HStack } from "@/components/ui/hstack";

const HAZARD_LABELS: Record<"low" | "medium" | "high" | "very_high", string> = {
	low: "Baixa",
	medium: "Média",
	high: "Alta",
	very_high: "Muito alta",
};

const HAZARD_ICONS: Record<
	"low" | "medium" | "high" | "very_high",
	React.ComponentType<object>
> = {
	low: ChevronDownIcon,
	medium: MinusIcon,
	high: ChevronUpIcon,
	very_high: ChevronsUpIcon,
};

const STATUS_LABELS: Record<"OPEN" | "RESOLVED", string> = {
	OPEN: "Aberta",
	RESOLVED: "Resolvida",
};

const STATUS_ICONS: Record<"OPEN" | "RESOLVED", React.ComponentType<object>> = {
	OPEN: ShieldIcon,
	RESOLVED: ShieldCheckIcon,
};

export type ComplaintFilterRowProps = {
	status: "ALL" | "OPEN" | "RESOLVED";
	categoryName: string | null;
	hazardLevel: "all" | "low" | "medium" | "high" | "very_high";
	radiusLabel: string;
	onPress: () => void;
};

export function ComplaintFilterRow({
	status,
	categoryName,
	hazardLevel,
	radiusLabel,
	onPress,
}: ComplaintFilterRowProps) {
	return (
		<HStack className="gap-2 items-center" pointerEvents="auto">
			<HStack className="h-12 flex-1 flex-row items-center gap-2 bg-white rounded-xl px-3 border border-border">
				<SearchIcon size={16} color={colors.gray[400]} strokeWidth={2} />
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerClassName="gap-1.5 items-center py-2"
				>
					<Badge variant="secondary" className="gap-2">
						<BadgeIcon
							as={
								hazardLevel !== "all"
									? HAZARD_ICONS[hazardLevel]
									: RadiationIcon
							}
						/>
						<BadgeText>
							{hazardLevel !== "all" ? HAZARD_LABELS[hazardLevel] : "Todos"}
						</BadgeText>
					</Badge>
					<Badge variant="secondary" className="gap-2">
						<BadgeIcon as={RecycleIcon} />
						<BadgeText>{categoryName ?? "Todos"}</BadgeText>
					</Badge>
					<Badge variant="secondary" className="gap-2">
						<BadgeIcon
							as={status !== "ALL" ? STATUS_ICONS[status] : ShieldIcon}
						/>
						<BadgeText>
							{status !== "ALL" ? STATUS_LABELS[status] : "Todos"}
						</BadgeText>
					</Badge>
					<Badge variant="secondary" className="gap-2">
						<BadgeIcon as={RadarIcon} />
						<BadgeText>{radiusLabel}</BadgeText>
					</Badge>
				</ScrollView>
			</HStack>

			<TouchableOpacity
				activeOpacity={0.85}
				onPress={onPress}
				className="h-12 w-12 items-center justify-center rounded-xl bg-lime-800"
				style={{
					shadowColor: colors.black,
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: 0.2,
					shadowRadius: 3,
					elevation: 3,
				}}
			>
				<Settings2Icon size={18} color={colors.white} strokeWidth={2} />
			</TouchableOpacity>
		</HStack>
	);
}

ComplaintFilterRow.displayName = "ComplaintFilterRow";
