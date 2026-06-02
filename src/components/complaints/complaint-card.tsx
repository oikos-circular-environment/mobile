"use client";

import {
	EllipsisVertical,
	EyeIcon,
	MapPinned,
	PlayCircleIcon,
	ShieldXIcon,
} from "lucide-react-native";
import { View } from "react-native";
import { colors } from "@/components/style/colors";
import { MediaThumbnail } from "@/components/medias-preview/media-thumbnail";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import {
	Menu,
	MenuItem,
	MenuItemLabel,
	MenuSeparator,
} from "@/components/ui/menu";
import { Pressable } from "@/components/ui/pressable";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { useComplaintCard } from "@/components/complaints/hooks/use-complaint-card";
import type { ApiComplaint } from "@/stores/complaints-store";
import { ComplaintStatusChip } from "./complaint-chip/complaint-status-chip";
import { ComplaintMap } from "./complaint-map";

interface ComplaintCardProps {
	complaint: ApiComplaint;
}

export function ComplaintCard({ complaint }: ComplaintCardProps) {
	return <ComplaintCardContent complaint={complaint} />;
}

function ComplaintCardContent({ complaint }: { complaint: ApiComplaint }) {
	const { cancelComplaint, openInMaps, isCancelingComplaint, openBottomSheet } =
		useComplaintCard(complaint);

	const firstCapture = complaint.captures[0];
	const firstAttachment = firstCapture?.attachments[0];
	const coords = firstCapture?.geospatial.location.coords;

	const address =
		firstCapture?.geospatial.addresses.formattedAddress ??
		[
			firstCapture?.geospatial.addresses.street,
			firstCapture?.geospatial.addresses.streetNumber,
			firstCapture?.geospatial.addresses.district,
			firstCapture?.geospatial.addresses.city,
			firstCapture?.geospatial.addresses.region,
			firstCapture?.geospatial.addresses.postalCode,
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
	const coordinatesLabel = coords
		? `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`
		: "—";

	return (
		<Card
			size="sm"
			className="gap-3 rounded-md border border-gray-100 bg-white p-3 shadow-none"
		>
			<View className="gap-2">
				<View className="flex-row items-center gap-2">
					{firstAttachment?.url ? (
						<View
							style={{
								width: 48,
								height: 48,
								borderRadius: 8,
								overflow: "hidden",
							}}
						>
							<MediaThumbnail
								mediaType={
									firstAttachment.type === "VIDEO" ? "video" : "photo"
								}
								uri={firstAttachment.url}
								fallbackLabel={
									firstAttachment.type === "VIDEO" ? "VIDEO" : "FOTO"
								}
							/>
							{firstAttachment.type === "VIDEO" ? (
								<View
									className="absolute inset-0 items-center justify-center"
									style={{ backgroundColor: colors.overlay.black25 }}
								>
									<PlayCircleIcon
										size={20}
										color={colors.white}
										strokeWidth={1.8}
									/>
								</View>
							) : null}
						</View>
					) : null}
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
							trigger={triggerProps => (
								<Pressable
									className="flex flex-col flex-1 items-center justify-between"
									{...triggerProps}
								>
									<ComplaintStatusChip
										status={complaint.status}
										size="sm"
										iconOnly
									/>
									<View className="size-5 items-center justify-center">
										{isCancelingComplaint ? (
											<Spinner size="small" />
										) : (
											<EllipsisVertical
												size={12}
												color={colors.gray[950]}
												strokeWidth={2.2}
											/>
										)}
									</View>
								</Pressable>
							)}
						>
							<MenuItem
								key="view-complaint"
								textValue="Ver denúncia"
								onPress={openBottomSheet}
							>
								<View className="flex-row items-center gap-2">
									<EyeIcon size={14} strokeWidth={2.2} />
									<MenuItemLabel>Ver denúncia</MenuItemLabel>
								</View>
							</MenuItem>

							<MenuItem
								key="cancel-complaint"
								textValue="Cancelar denúncia"
								onPress={cancelComplaint}
								disabled={isCancelingComplaint}
							>
								<View className="flex-row items-center gap-2">
									{isCancelingComplaint ? (
										<Spinner size="small" />
									) : (
										<ShieldXIcon
											size={14}
											color={colors.red[700]}
											strokeWidth={2.2}
										/>
									)}
									<MenuItemLabel>Cancelar denúncia</MenuItemLabel>
								</View>
							</MenuItem>

							<MenuSeparator />

							<MenuItem
								key="open-maps"
								textValue="Abrir no mapa externo"
								onPress={openInMaps}
							>
								<View className="flex-row items-center gap-2">
									<MapPinned size={14} strokeWidth={2.2} />
									<MenuItemLabel>Abrir no mapa externo</MenuItemLabel>
								</View>
							</MenuItem>
						</Menu>
					</View>
				</View>

				<ComplaintMap
					latitude={coords?.latitude ?? 0}
					longitude={coords?.longitude ?? 0}
				/>
			</View>
		</Card>
	);
}

export function ComplaintCardSkeleton() {
	return (
		<Card
			size="sm"
			className="gap-3 rounded-md border border-gray-100 bg-white p-3 shadow-none"
		>
			<View className="gap-2">
				<View className="flex-row items-center gap-2">
					<Skeleton startColor="bg-gray-200" className="w-16 h-16 rounded-md" />
					<Skeleton
						startColor="bg-gray-200"
						className="flex-1 h-16 rounded-md"
					/>
					<Skeleton startColor="bg-gray-200" className="w-4 h-16 rounded-md" />
				</View>
				<Skeleton startColor="bg-gray-200" className="h-32 w-full rounded" />
			</View>
		</Card>
	);
}
