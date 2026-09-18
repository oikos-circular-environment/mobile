"use client";

import { format, formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CompassIcon, PlayCircleIcon } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useComplaintCard } from "@/components/complaints/hooks/use-complaint-card";
import {
	WasteCategoryHazardLevel,
	WasteCategoryHazardLevelIcon,
	WasteCategoryHazardLevelText,
} from "@/components/custom/waste-category/waste-category-hazard-level";
import { MediaThumbnail } from "@/components/medias-preview/media-thumbnail";
import { colors } from "@/components/style/colors";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import {
	Modal,
	ModalBackdrop,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
} from "@/components/ui/modal";
import { Text } from "@/components/ui/text";
import type { Complaint } from "@/libs/types/complaint";
import { highestHazardVariant } from "./complaint-hazard-address-utils";
import { ComplaintMap } from "./complaint-map";
import { ComplaintStatusBadge, getComplaintStatusLabel } from "./filters";

interface ComplaintCardProps {
	complaint: Complaint;
}

export function ComplaintCard({ complaint }: ComplaintCardProps) {
	const {
		cancelComplaint,
		isCancelingComplaint,
		openComplaintDetail,
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

	const createdAtDate = new Date(complaint.created_at);
	const createdAtLabel = `${format(createdAtDate, "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })} - ${getComplaintStatusLabel(complaint.status)} à ${formatDistanceToNowStrict(createdAtDate, { locale: ptBR })}`;
	const coordinatesLabel = coords
		? `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`
		: "—";

	const isEditDisabled = complaint.status !== "OPEN";

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
				<View className="gap-3">
					<View className="flex-row items-center gap-2">
						<View className="flex-1 justify-center">
							<Heading numberOfLines={1}>
								{address || "Endereço não informado"}
							</Heading>
							<Text className="text-sm text-gray-500" selectable>
								{createdAtLabel}
							</Text>
							<View className="flex-row items-center gap-1">
								<CompassIcon
									size={12}
									color={colors.gray[400]}
									strokeWidth={2}
								/>
								<Text className="text-sm text-gray-500" selectable>
									{coordinatesLabel}
								</Text>
							</View>
						</View>

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
					</View>

					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerClassName="gap-2 px-2"
					>
						<ComplaintStatusBadge status={complaint.status} size="sm" />
						{complaint.categories.map(category => (
							<WasteCategoryHazardLevel
								key={category.id}
								variant={highestHazardVariant(category.hazard_levels)}
							>
								<WasteCategoryHazardLevelIcon />
								<WasteCategoryHazardLevelText>
									{category.name}
								</WasteCategoryHazardLevelText>
							</WasteCategoryHazardLevel>
						))}
					</ScrollView>

					{complaint.observations && (
						<Text className="text-gray-600" numberOfLines={2}>
							{complaint.observations}
						</Text>
					)}

					<ComplaintMap
						latitude={coords?.latitude ?? 0}
						longitude={coords?.longitude ?? 0}
					/>

					<View className="flex-row gap-2">
						<Button
							variant="outline"
							className="flex-1 rounded-xl border-0 bg-gray-100"
							onPress={() => setIsCancelModalOpen(true)}
							isDisabled={isCancelingComplaint}
						>
							{isCancelingComplaint && <ButtonSpinner />}
							<ButtonText className="text-gray-900">Cancelar</ButtonText>
						</Button>
						<Button
							variant="outline"
							className="flex-1 rounded-xl border-0 bg-gray-100"
							onPress={editComplaint}
							isDisabled={isEditDisabled}
						>
							<ButtonText className="text-gray-900">Editar</ButtonText>
						</Button>
					</View>

					<Button
						variant="outline"
						className="w-full rounded-xl border-0 bg-gray-100"
						onPress={openComplaintDetail}
					>
						<ButtonText className="text-gray-900">Detalhes</ButtonText>
					</Button>
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
