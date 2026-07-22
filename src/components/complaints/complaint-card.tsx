"use client";

import {
	EllipsisVertical,
	EyeIcon,
	MapPinned,
	PencilIcon,
	PlayCircleIcon,
	ShieldXIcon,
} from "lucide-react-native";
import { useState } from "react";
import { Platform, View } from "react-native";
import { useComplaintCard } from "@/components/complaints/hooks/use-complaint-card";
import { MediaThumbnail } from "@/components/medias-preview/media-thumbnail";
import { colors } from "@/components/style/colors";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import {
	Menu,
	MenuItem,
	MenuItemLabel,
	MenuSeparator,
} from "@/components/ui/menu";
import {
	Modal,
	ModalBackdrop,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
} from "@/components/ui/modal";
import { Pressable } from "@/components/ui/pressable";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import type { Complaint } from "@/libs/types/complaint";
import { ComplaintMap } from "./complaint-map";
import { ComplaintStatusBadge } from "./filter-components/complaint-status-chip";

interface ComplaintCardProps {
	complaint: Complaint;
}

export function ComplaintCard({ complaint }: ComplaintCardProps) {
	const {
		cancelComplaint,
		openInGoogleMaps,
		openInAppleMaps,
		isCancelingComplaint,
		openBottomSheet,
		editComplaint,
	} = useComplaintCard(complaint);
	const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

	const firstAttachment = complaint.attachments[0];
	const coords = complaint.geospatial.location.coords;

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
	const coordinatesLabel = coords
		? `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`
		: "—";

	const handleConfirmCancel = () => {
		setIsCancelModalOpen(false);
		cancelComplaint();
	};

	return (
		<>
			<Card
				size="sm"
				className="gap-3 rounded-md border border-gray-100 bg-white p-3 shadow-none"
			>
				<View className="gap-2">
					<View className="flex-row items-center gap-2">
						{firstAttachment?.url && (
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
								{firstAttachment.type === "VIDEO" && (
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
								)}
							</View>
						)}
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
										<ComplaintStatusBadge
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
										<EyeIcon size={14} color={colors.gray[950]} strokeWidth={2.2} />
										<MenuItemLabel>Ver denúncia</MenuItemLabel>
									</View>
								</MenuItem>

								<MenuItem
									key="edit-complaint"
									textValue="Editar denúncia"
									onPress={editComplaint}
									disabled={complaint.status !== "OPEN"}
								>
									<View className="flex-row items-center gap-2">
										<PencilIcon
											size={14}
											strokeWidth={2.2}
											color={
												complaint.status !== "OPEN"
													? colors.gray[400]
													: colors.gray[950]
											}
										/>
										<MenuItemLabel
											className={
												complaint.status !== "OPEN" ? "text-gray-400" : ""
											}
										>
											Editar denúncia
										</MenuItemLabel>
									</View>
								</MenuItem>

								<MenuItem
									key="cancel-complaint"
									textValue="Cancelar denúncia"
									onPress={() => setIsCancelModalOpen(true)}
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
									key="open-google-maps"
									textValue="Abrir no Google Maps"
									onPress={openInGoogleMaps}
								>
									<View className="flex-row items-center gap-2">
										<MapPinned
											size={14}
											color={colors.gray[950]}
											strokeWidth={2.2}
										/>
										<MenuItemLabel>Abrir no Google Maps</MenuItemLabel>
									</View>
								</MenuItem>

								{Platform.OS === "ios" && (
									<MenuItem
										key="open-apple-maps"
										textValue="Abrir no Apple Maps"
										onPress={openInAppleMaps}
									>
										<View className="flex-row items-center gap-2">
											<MapPinned
												size={14}
												color={colors.gray[950]}
												strokeWidth={2.2}
											/>
											<MenuItemLabel>Abrir no Apple Maps</MenuItemLabel>
										</View>
									</MenuItem>
								)}
							</Menu>
						</View>
					</View>

					<ComplaintMap
						latitude={coords?.latitude ?? 0}
						longitude={coords?.longitude ?? 0}
					/>
				</View>
			</Card>

			<Modal
				isOpen={isCancelModalOpen}
				onClose={() => setIsCancelModalOpen(false)}
				size="sm"
			>
				<ModalBackdrop />
				<ModalContent>
					<ModalHeader>
						<Heading size="md">Cancelar denúncia</Heading>
					</ModalHeader>
					<ModalBody>
						<Text className="text-sm text-gray-600">
							Tem certeza que deseja cancelar esta denúncia? Esta ação não pode
							ser desfeita.
						</Text>
					</ModalBody>
					<ModalFooter className="gap-2">
						<Button
							variant="outline"
							className="flex-1"
							onPress={() => setIsCancelModalOpen(false)}
							isDisabled={isCancelingComplaint}
						>
							<ButtonText>Voltar</ButtonText>
						</Button>
						<Button
							className="flex-1 bg-red-600"
							onPress={handleConfirmCancel}
							isDisabled={isCancelingComplaint}
						>
							<ButtonText className="text-white">Cancelar</ButtonText>
							{isCancelingComplaint && <ButtonSpinner />}
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</>
	);
}
