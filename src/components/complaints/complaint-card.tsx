"use client";

import { Image } from "expo-image";
import {
	EllipsisVertical,
	EyeIcon,
	MapPinned,
	ShieldCheckIcon,
	ShieldXIcon,
} from "lucide-react-native";
import { View } from "react-native";
import { toast } from "@/components/toast";
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
import {
	ComplaintCardProvider,
	useComplaintCardContext,
} from "@/contexts/complaint-card-context";
import type { ApiComplaint } from "@/contexts/complaints-context";
import { ComplaintMap } from "./complaint-map";
import { ComplaintStatusComponent } from "./complaint-status";

interface ComplaintCardProps {
	complaint: ApiComplaint;
}

export function ComplaintCard({ complaint }: ComplaintCardProps) {
	return (
		<ComplaintCardProvider complaint={complaint}>
			<ComplaintCardContent />
		</ComplaintCardProvider>
	);
}

function ComplaintCardContent() {
	const {
		complaint,
		resolveComplaint,
		cancelComplaint,
		openInMaps,
		isResolvingComplaint,
		isCancelingComplaint,
	} = useComplaintCardContext();

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

	const createdAtLabel = new Date(complaint.created_at).toLocaleString("pt-BR", {
		dateStyle: "short",
		timeStyle: "medium",
	});
	const coordinatesLabel = `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
	const isMutating = isResolvingComplaint || isCancelingComplaint;

	const handleViewComplaint = () => {
		toast.info("Em breve", "Detalhes da denúncia ainda não disponíveis.");
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
							trigger={triggerProps => (
								<Pressable
									className="flex flex-col flex-1 items-center justify-between"
									{...triggerProps}
								>
									<ComplaintStatusComponent status={complaint.status} />
									<View className="size-5 items-center justify-center">
										{isMutating ? (
											<Spinner size="small" />
										) : (
											<EllipsisVertical
												size={12}
												color="#030712"
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
								onPress={resolveComplaint}
								disabled={isMutating}
							>
								<View className="flex-row items-center gap-2">
									{isResolvingComplaint ? (
										<Spinner size="small" />
									) : (
										<ShieldCheckIcon
											size={14}
											color="#3F6212"
											strokeWidth={2.2}
										/>
									)}
									<MenuItemLabel>Marcar como resolvida</MenuItemLabel>
								</View>
							</MenuItem>

							<MenuItem
								key="cancel-complaint"
								textValue="Cancelar denúncia"
								onPress={cancelComplaint}
								disabled={isMutating}
							>
								<View className="flex-row items-center gap-2">
									{isCancelingComplaint ? (
										<Spinner size="small" />
									) : (
										<ShieldXIcon size={14} color="#B91C1C" strokeWidth={2.2} />
									)}
									<MenuItemLabel>Cancelar denúncia</MenuItemLabel>
								</View>
							</MenuItem>

							<MenuSeparator />

							<MenuItem
								key="open-maps"
								textValue="Abrir no mapa"
								onPress={openInMaps}
							>
								<View className="flex-row items-center gap-2">
									<MapPinned size={14} strokeWidth={2.2} />
									<MenuItemLabel>Abrir no mapa</MenuItemLabel>
								</View>
							</MenuItem>
						</Menu>
					</View>
				</View>

				{complaint.attachment?.url &&
				complaint.attachment.type === "PHOTO" ? (
					<Image
						source={{ uri: complaint.attachment.url }}
						contentFit="cover"
						style={{ width: "100%", height: 160, borderRadius: 8 }}
					/>
				) : null}

				<ComplaintMap latitude={coords.latitude} longitude={coords.longitude} />
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
					<View className="flex-1 gap-2">
						<Skeleton startColor="bg-gray-200" className="h-5 w-3/4 rounded" />
						<Skeleton startColor="bg-gray-200" className="h-3 w-1/2 rounded" />
						<Skeleton startColor="bg-gray-200" className="h-3 w-1/3 rounded" />
					</View>
					<Skeleton
						startColor="bg-gray-200"
						className="size-16 rounded-md"
					/>
				</View>
				<Skeleton startColor="bg-gray-200" className="h-32 w-full rounded" />
			</View>
		</Card>
	);
}
