import { format, formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
	CalendarIcon,
	CrosshairIcon,
	HashIcon,
	MapPinIcon,
} from "lucide-react-native";
import { ScrollView, View } from "react-native";
import {
	type HazardLevelVariant,
	WasteCategoryHazardLevel,
	WasteCategoryHazardLevelIcon,
	WasteCategoryHazardLevelText,
} from "@/components/custom/waste-category/waste-category-hazard-level";
import { colors } from "@/components/style/colors";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { HStack } from "../ui/hstack";
import { ComplaintStatusBadge } from "./filter-components/complaint-status-chip";

export type HeaderComplaint = {
	id: string;
	status: "OPEN" | "RESOLVED" | "CANCELED";
	categories: Array<{
		id: string;
		name: string;
		hazard_levels: Array<"LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH">;
	}>;
	observations: string | null;
	created_at: Date | string;
	geospatial: {
		addresses: {
			street?: string | null;
			streetNumber?: string | null;
			district?: string | null;
		};
	};
	location: { lat: number; lon: number } | null;
};

type Props = {
	complaint: HeaderComplaint;
	userLocation?: { lat: number; lon: number } | null;
};

const HAZARD_PRIORITY: Record<string, number> = {
	LOW: 1,
	MEDIUM: 2,
	HIGH: 3,
	VERY_HIGH: 4,
};

const HAZARD_VARIANT: Record<string, HazardLevelVariant> = {
	LOW: "low",
	MEDIUM: "medium",
	HIGH: "high",
	VERY_HIGH: "very_high",
};

function highestHazardVariant(levels: string[]): HazardLevelVariant {
	const highest = levels.reduce(
		(max, lvl) =>
			(HAZARD_PRIORITY[lvl] ?? 0) > (HAZARD_PRIORITY[max] ?? 0) ? lvl : max,
		levels[0] ?? "LOW",
	);
	return HAZARD_VARIANT[highest] ?? "low";
}

function deriveAddress(complaint: HeaderComplaint): string | null {
	const { addresses } = complaint.geospatial;
	const streetPart = [addresses.street, addresses.streetNumber]
		.filter(Boolean)
		.join(", ");
	return [streetPart, addresses.district].filter(Boolean).join(" — ") || null;
}

function haversineKm(
	lat1: number,
	lon1: number,
	lat2: number,
	lon2: number,
): number {
	const R = 6371;
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLon = ((lon2 - lon1) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLon / 2) ** 2;
	return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDist(km: number): string {
	return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

export function ComplaintDetailsHeader({ complaint, userLocation }: Props) {
	const createdAt = new Date(complaint.created_at);
	const address = deriveAddress(complaint);
	const dateLabel =
		`${format(createdAt, "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}` +
		` • Aberto à ${formatDistanceToNowStrict(createdAt, { locale: ptBR })}`;
	const coords = complaint.location
		? `${complaint.location.lat.toFixed(4)}, ${complaint.location.lon.toFixed(4)}`
		: null;
	const distanceLabel =
		userLocation && complaint.location
			? formatDist(
					haversineKm(
						userLocation.lat,
						userLocation.lon,
						complaint.location.lat,
						complaint.location.lon,
					),
				)
			: null;

	return (
		<View className="gap-2">
			<Badge variant="outline" className="self-start">
				<BadgeIcon as={HashIcon} />
				<BadgeText>{complaint.id}</BadgeText>
			</Badge>

			<Text
				className="text-2xl font-bold text-gray-950"
				style={{ fontFamily: "Oswald_700Bold" }}
				numberOfLines={2}
			>
				DESCARTE IRREGULAR
			</Text>

			<View className="flex-row items-center justify-between">
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					className="shrink"
					contentContainerClassName="gap-1.5 items-center flex-row"
				>
					<ComplaintStatusBadge status={complaint.status} size="sm" />
					{complaint.categories.map(cat => (
						<WasteCategoryHazardLevel
							key={cat.id}
							variant={highestHazardVariant(cat.hazard_levels)}
						>
							<WasteCategoryHazardLevelIcon />
							<WasteCategoryHazardLevelText>
								{cat.name}
							</WasteCategoryHazardLevelText>
						</WasteCategoryHazardLevel>
					))}
				</ScrollView>
			</View>

			{!!address && (
				<View className="flex-row items-center gap-1.5">
					<MapPinIcon size={13} color={colors.gray[500]} strokeWidth={2} />
					<Text className="flex-1 text-gray-500" numberOfLines={1}>
						{address}
					</Text>
				</View>
			)}

			<View className="flex-row items-center gap-1.5">
				<CalendarIcon size={13} color={colors.gray[500]} strokeWidth={2} />
				<Text className="text-gray-500">{dateLabel}</Text>
			</View>

			{!!coords && (
				<HStack space="sm">
					<CrosshairIcon size={13} color={colors.gray[500]} strokeWidth={2} />
					<Text className="text-gray-500">{coords}</Text>
					{!!distanceLabel && (
						<Badge className="ml-2 flex-row items-center gap-1 rounded-xl bg-gray-100 px-2 py-1">
							<BadgeIcon as={MapPinIcon} className="text-gray-500" />
							<BadgeText className="text-gray-500">{distanceLabel}</BadgeText>
						</Badge>
					)}
				</HStack>
			)}

			{!!complaint.observations && (
				<View className="gap-1">
					<Heading size="sm">Observações</Heading>
					<Text className="leading-5 text-gray-600">
						{complaint.observations}
					</Text>
				</View>
			)}
		</View>
	);
}
