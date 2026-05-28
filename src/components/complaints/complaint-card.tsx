"use client";

import {
	EllipsisVertical,
	EyeIcon,
	MapPinned,
	PlayCircleIcon,
	ShieldCheckIcon,
	ShieldXIcon,
	StarIcon,
} from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { colors } from "@/components/style/colors";
import { MediaThumbnail } from "@/components/common/media-thumbnail";
import { toast } from "@/components/toast";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Input, InputField } from "@/components/ui/input";
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
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { Pressable } from "@/components/ui/pressable";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import {
	ComplaintCardProvider,
	useComplaintCardContext,
} from "@/contexts/complaint-card-context";
import type { ResolveComplaintData } from "@/contexts/complaint-card-context";
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

	const [showResolveModal, setShowResolveModal] = useState(false);
	const [resolveDescription, setResolveDescription] = useState("");
	const [resolveResolver, setResolveResolver] = useState("");
	const [resolveRating, setResolveRating] = useState(5);

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
	const isMutating = isResolvingComplaint || isCancelingComplaint;

	const handleViewComplaint = () => {
		toast.info("Em breve", "Detalhes da denúncia ainda não disponíveis.");
	};

	const handleResolvePress = () => {
		setResolveDescription("");
		setResolveResolver("");
		setResolveRating(5);
		setShowResolveModal(true);
	};

	const handleResolveSubmit = () => {
		if (!resolveDescription.trim()) {
			toast.error("Campo obrigatório", "Informe uma descrição da resolução.");
			return;
		}
		if (!resolveResolver.trim()) {
			toast.error("Campo obrigatório", "Informe quem resolveu a denúncia.");
			return;
		}
		const data: ResolveComplaintData = {
			description: resolveDescription.trim(),
			resolver: resolveResolver.trim(),
			rating: resolveRating,
		};
		resolveComplaint(data);
		setShowResolveModal(false);
	};

	return (
		<>
			<Card
				size="sm"
				className="gap-3 rounded-md border border-gray-100 bg-white p-3 shadow-none"
			>
				<View className="gap-2">
					<View className="flex-row items-center gap-2">
						{firstAttachment?.url ? (
							<View style={{ width: 48, height: 48, borderRadius: 8, overflow: "hidden" }}>
								<MediaThumbnail
									mediaType={firstAttachment.type === "VIDEO" ? "video" : "photo"}
									uri={firstAttachment.url}
									fallbackLabel={firstAttachment.type === "VIDEO" ? "VIDEO" : "FOTO"}
								/>
								{firstAttachment.type === "VIDEO" ? (
									<View
										className="absolute inset-0 items-center justify-center"
										style={{ backgroundColor: colors.overlay.black25 }}
									>
										<PlayCircleIcon size={20} color={colors.white} strokeWidth={1.8} />
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
										<ComplaintStatusComponent status={complaint.status} />
										<View className="size-5 items-center justify-center">
											{isMutating ? (
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
									onPress={handleResolvePress}
									disabled={isMutating}
								>
									<View className="flex-row items-center gap-2">
										{isResolvingComplaint ? (
											<Spinner size="small" />
										) : (
											<ShieldCheckIcon
												size={14}
												color={colors.lime[800]}
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
											<ShieldXIcon size={14} color={colors.red[700]} strokeWidth={2.2} />
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

					<ComplaintMap
						latitude={coords?.latitude ?? 0}
						longitude={coords?.longitude ?? 0}
					/>
				</View>
			</Card>

			<Modal
				isOpen={showResolveModal}
				onClose={() => setShowResolveModal(false)}
				useRNModal
			>
				<ModalBackdrop />
				<ModalContent>
					<ModalHeader className="flex-col items-start gap-1">
						<Heading size="md" className="text-base text-gray-950">
							Registrar resolução
						</Heading>
						<Text className="text-sm text-gray-500">
							Informe como a denúncia foi resolvida. Seu voto de "resolvida" será registrado com peso maior por ser o dono.
						</Text>
					</ModalHeader>
					<ModalBody className="gap-4">
						<View className="gap-1">
							<Text className="text-sm font-medium text-gray-700">Descrição *</Text>
							<Input>
								<InputField
									multiline
									numberOfLines={3}
									textAlignVertical="top"
									placeholder="Descreva como o problema foi resolvido."
									value={resolveDescription}
									onChangeText={setResolveDescription}
								/>
							</Input>
						</View>

						<View className="gap-1">
							<Text className="text-sm font-medium text-gray-700">Quem resolveu *</Text>
							<Input>
								<InputField
									placeholder="Nome da pessoa ou órgão responsável."
									value={resolveResolver}
									onChangeText={setResolveResolver}
								/>
							</Input>
						</View>

						<View className="gap-1">
							<Text className="text-sm font-medium text-gray-700">Avaliação</Text>
							<View className="flex-row gap-2">
								{[1, 2, 3, 4, 5].map(star => (
									<Pressable key={star} onPress={() => setResolveRating(star)}>
										<StarIcon
											size={28}
											color={star <= resolveRating ? colors.lime[800] : colors.gray[300]}
											fill={star <= resolveRating ? colors.lime[800] : "transparent"}
											strokeWidth={1.5}
										/>
									</Pressable>
								))}
							</View>
						</View>
					</ModalBody>
					<ModalFooter className="gap-2">
						<Button
							variant="outline"
							className="flex-1 rounded-md border-gray-200"
							onPress={() => setShowResolveModal(false)}
							disabled={isResolvingComplaint}
						>
							<ButtonText className="text-gray-700">Cancelar</ButtonText>
						</Button>
						<Button
							className="flex-1 bg-lime-800 rounded-md"
							onPress={handleResolveSubmit}
							disabled={isResolvingComplaint}
						>
							<ButtonText>Confirmar</ButtonText>
							{isResolvingComplaint && <ButtonSpinner />}
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</>
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
