"use client";

import {
	EllipsisVertical,
	EyeIcon,
	MapPinned,
	ShieldCheckIcon,
	ShieldXIcon,
} from "lucide-react-native";
import { Alert, Linking, Platform, View } from "react-native";
import { ComplaintMap } from "@/components/complaints/complaint-map";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import {
	Menu,
	MenuItem,
	MenuItemLabel,
	MenuSeparator,
} from "@/components/ui/menu";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import type { Complaint } from "@/libs/types/complaint";
import { ComplaintStatusComponent } from "./complaint-status";

interface ComplaintCardProps {
	complaint: Complaint;
}

export function ComplaintCard({ complaint }: ComplaintCardProps) {
	const { coords } = complaint.geospatial.location;
	const address =
		complaint.geospatial.addresses.formattedAddress ??
		[
			complaint.geospatial.addresses.street,
			complaint.geospatial.addresses.streetNumber,
			complaint.geospatial.addresses.district,
			complaint.geospatial.addresses.city,
			complaint.geospatial.addresses.region,
			complaint.geospatial.addresses.postalCode,
		]
			.filter(Boolean)
			.join(", ");
	const createdAtLabel = new Date(complaint.created_at).toLocaleString(
		"pt-BR",
		{
			dateStyle: "short",
			timeStyle: "medium",
		},
	);
	const coordinatesLabel = `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;

	const handleViewComplaint = () => {
		Alert.alert("Denúncia", "Abrindo detalhes da denúncia.");
	};

	const handleMarkResolved = () => {
		Alert.alert("Denúncia", "Denúncia marcada como resolvida.");
	};

	const handleCancelComplaint = () => {
		Alert.alert("Denúncia", "Denúncia cancelada.");
	};

	const handleOpenInMaps = async () => {
		const { latitude, longitude } = coords;
		const mapsUrl =
			Platform.OS === "ios"
				? `http://maps.apple.com/?ll=${latitude},${longitude}`
				: `geo:${latitude},${longitude}?q=${latitude},${longitude}`;

		const fallbackUrl =
			`https://www.google.com/maps/search/?api=1&query=` +
			`${latitude},${longitude}`;

		try {
			const canOpenNative = await Linking.canOpenURL(mapsUrl);

			if (canOpenNative) {
				await Linking.openURL(mapsUrl);
				return;
			}

			await Linking.openURL(fallbackUrl);
		} catch {
			Alert.alert("Maps", "Não foi possível abrir o aplicativo de mapas.");
		}
	};

	return (
		<Card
			size="sm"
			className="gap-3 rounded-md border border-gray-100 bg-white p-3 shadow-none"
		>
			<View className="gap-2">
				<View className="flex-row items-center gap-2">
					<View className="flex-1 justify-center">
						<Heading numberOfLines={1}>
							{address || "Endereço não informado"}
						</Heading>
						<Text className="text-sm text-gray-500" selectable>
							{createdAtLabel}
						</Text>
						<Text className="text-sm text-gray-500" selectable>
							{coordinatesLabel}
						</Text>
					</View>

					<View className="items-center gap-2 rounded-md bg-gray-100 p-1">
						<Menu
							placement="bottom right"
							offset={8}
							trigger={triggerProps => {
								return (
									<Pressable
										className="flex flex-col flex-1 items-center justify-between"
										{...triggerProps}
									>
										<ComplaintStatusComponent status={complaint.status} />
										<View className="size-5 items-center justify-center">
											<EllipsisVertical
												size={12}
												color="#030712"
												strokeWidth={2.2}
											/>
										</View>
									</Pressable>
								);
							}}
						>
							<MenuItem
								key="view-complaint"
								textValue="Ver denúncia"
								onPress={handleViewComplaint}
							>
								<View className="flex-row items-center gap-2">
									<EyeIcon size={14} strokeWidth={2.2} />
									<MenuItemLabel>Ver denúncia</MenuItemLabel>
								</View>
							</MenuItem>

							<MenuItem
								key="mark-resolved"
								textValue="Marcar como resolvida"
								onPress={handleMarkResolved}
							>
								<View className="flex-row items-center gap-2">
									<ShieldCheckIcon
										size={14}
										color="#3F6212"
										strokeWidth={2.2}
									/>
									<MenuItemLabel>Marcar como resolvida</MenuItemLabel>
								</View>
							</MenuItem>

							<MenuItem
								key="cancel-complaint"
								textValue="Cancelar denúncia"
								onPress={handleCancelComplaint}
							>
								<View className="flex-row items-center gap-2">
									<ShieldXIcon size={14} color="#B91C1C" strokeWidth={2.2} />
									<MenuItemLabel>Cancelar denúncia</MenuItemLabel>
								</View>
							</MenuItem>

							<MenuSeparator />

							<MenuItem
								key="open-maps"
								textValue="Abrir no maps"
								onPress={handleOpenInMaps}
							>
								<View className="flex-row items-center gap-2">
									<MapPinned size={14} strokeWidth={2.2} />
									<MenuItemLabel>Abrir no mapa</MenuItemLabel>
								</View>
							</MenuItem>
						</Menu>
					</View>
				</View>

				<ComplaintMap latitude={coords.latitude} longitude={coords.longitude} />
			</View>
		</Card>
	);
}
