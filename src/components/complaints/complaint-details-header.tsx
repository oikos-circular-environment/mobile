import { format, formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getDistance } from "geolib";
import {
	CalendarIcon,
	CrosshairIcon,
	ForwardIcon,
	HashIcon,
	MapPinIcon,
} from "lucide-react-native";
import { Alert, Platform, ScrollView, View } from "react-native";
import {
	WasteCategoryHazardLevel,
	WasteCategoryHazardLevelIcon,
	WasteCategoryHazardLevelText,
} from "@/components/custom/waste-category/waste-category-hazard-level";
import { colors } from "@/components/style/colors";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Menu, MenuItem, MenuItemLabel } from "@/components/ui/menu";
import { Text } from "@/components/ui/text";
import { formatDistance } from "@/libs/format-distance";
import { openAppleMaps, openGoogleMaps, openInMaps } from "@/libs/open-in-maps";
import { HStack } from "../ui/hstack";
import {
	deriveAddress,
	highestHazardVariant,
} from "./complaint-hazard-address-utils";
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

	const handleOpenInMaps = async (provider?: "apple" | "google") => {
		if (!complaint.location) return;
		const { lat, lon } = complaint.location;
		try {
			if (provider === "apple") await openAppleMaps(lat, lon);
			else if (provider === "google") await openGoogleMaps(lat, lon);
			else await openInMaps(lat, lon);
		} catch {
			Alert.alert("Mapa", "Não foi possível abrir o aplicativo de mapas.");
		}
	};

	return (
		<View className="gap-2">
			<Badge variant="outline" className="self-start">
				<BadgeIcon as={HashIcon} />
				<BadgeText>{complaint.id}</BadgeText>
			</Badge>

			<View className="flex-row items-start justify-between gap-2">
				<Text
					className="flex-1 shrink text-2xl font-bold text-gray-950"
					style={{ fontFamily: "Oswald_700Bold" }}
				>
					DESCARTE IRREGULAR
				</Text>

				{!!complaint.location && (
					<View className="shrink-0">
						{Platform.OS === "ios" ? (
							<Menu
								placement="bottom right"
								offset={8}
								trigger={triggerProps => (
									<Button variant="outline" size="sm" {...triggerProps}>
										<ButtonIcon as={ForwardIcon} />
										<ButtonText>Abrir no mapa</ButtonText>
									</Button>
								)}
							>
								<MenuItem
									key="apple-maps"
									textValue="Abrir na Apple Maps"
									onPress={() => handleOpenInMaps("apple")}
								>
									<MenuItemLabel>Abrir na Apple Maps</MenuItemLabel>
								</MenuItem>
								<MenuItem
									key="google-maps"
									textValue="Abrir no Google Maps"
									onPress={() => handleOpenInMaps("google")}
								>
									<MenuItemLabel>Abrir no Google Maps</MenuItemLabel>
								</MenuItem>
							</Menu>
						) : (
							<Button
								variant="outline"
								size="sm"
								onPress={() => handleOpenInMaps()}
							>
								<ButtonIcon as={ForwardIcon} />
								<ButtonText>Abrir no mapa</ButtonText>
							</Button>
						)}
					</View>
				)}
			</View>

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
