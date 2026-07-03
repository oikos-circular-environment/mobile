import { getDistance } from "geolib";
import { HashIcon, MapPinIcon, Trash2Icon } from "lucide-react-native";
import { Pressable, ScrollView, View } from "react-native";
import {
	type HazardLevelVariant,
	WasteCategoryHazardLevel,
	WasteCategoryHazardLevelIcon,
	WasteCategoryHazardLevelText,
} from "@/components/custom/waste-category/waste-category-hazard-level";
import { MediaThumbnail } from "@/components/medias-preview/media-thumbnail";
import { colors } from "@/components/style/colors";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import { formatDistance } from "@/libs/format-distance";
import type { MapComplaint } from "@/libs/types/complaint";
import { cn } from "@/libs/utils";
import { ComplaintStatusBadge } from "../filter-components/complaint-status-chip";

type Props = {
	complaint: MapComplaint;
	userLocation: { lat: number; lon: number } | null;
	isSelected: boolean;
	onPress: (complaint: MapComplaint) => void;
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

function deriveAddress(complaint: MapComplaint): string | null {
	const { addresses } = complaint.geospatial;
	const streetPart = [addresses.street, addresses.streetNumber]
		.filter(Boolean)
		.join(", ");
	return [streetPart, addresses.district].filter(Boolean).join(" — ") || null;
}

export function ComplaintMapListItem({
	complaint,
	userLocation,
	isSelected,
	onPress,
}: Props) {
	const thumbnail = complaint.attachments?.[0];
	const address = deriveAddress(complaint);

	const distance =
		userLocation && complaint.location
			? formatDistance(
					getDistance(
						{ latitude: userLocation.lat, longitude: userLocation.lon },
						{
							latitude: complaint.location.lat,
							longitude: complaint.location.lon,
						},
					),
				)
			: null;

	const addressLine = [address, distance].filter(Boolean).join(" • ");

	return (
		<Pressable
			onPress={() => onPress(complaint)}
			className={cn(
				"flex-row items-center gap-3 px-4 py-3",
				isSelected && "bg-amber-50",
			)}
		>
			{thumbnail ? (
				<View className="h-18 w-18 shrink-0 overflow-hidden rounded-lg bg-gray-100">
					<MediaThumbnail
						mediaType={thumbnail.type === "PHOTO" ? "photo" : "video"}
						uri={thumbnail.url}
					/>
				</View>
			) : (
				<View
					className="h-18 w-18 shrink-0 items-center justify-center rounded-lg"
					style={{ backgroundColor: colors.amber[500] }}
				>
					<Trash2Icon size={20} color={colors.white} strokeWidth={2.5} />
				</View>
			)}

			<View className="flex-1 gap-0.5">
				<Badge className="w-22 gap-1" variant="outline">
					<BadgeIcon as={HashIcon} />
					<BadgeText>{complaint.id.slice(0, 8)}</BadgeText>
				</Badge>

				<Text
					className="text-sm font-bold leading-tight text-gray-900"
					numberOfLines={1}
				>
					DESCARTE IRREGULAR
				</Text>

				{!!complaint.observations && (
					<Text className="text-xs text-gray-500" numberOfLines={1}>
						{complaint.observations}
					</Text>
				)}

				{!!addressLine && (
					<View className="flex-row items-center gap-1 pt-0.5">
						<MapPinIcon size={10} color={colors.gray[400]} strokeWidth={2} />
						<Text className="flex-1 text-xs text-gray-400" numberOfLines={1}>
							{addressLine}
						</Text>
					</View>
				)}

				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerClassName="flex-row items-center gap-1.5 pt-0.5"
				>
					<ComplaintStatusBadge status={complaint.status} size="xs" />
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
		</Pressable>
	);
}
