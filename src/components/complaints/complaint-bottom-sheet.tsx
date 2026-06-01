import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { router } from "expo-router";
import {
	AlertTriangleIcon,
	ArrowLeftIcon,
	BuildingIcon,
	CalendarIcon,
	CrosshairIcon,
	InfoIcon,
	MapPinIcon,
	PlayIcon,
	PlusIcon,
	ThumbsDownIcon,
	ThumbsUpIcon,
	UserIcon,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Modal, ScrollView, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ImagePreviewViewer } from "@/components/medias-preview/image-preview-viewer";
import { MediaThumbnail } from "@/components/medias-preview/media-thumbnail";
import { VideoPreviewPlayer } from "@/components/medias-preview/video-preview-player";
import { colors } from "@/components/style/colors";
import {
	BottomSheet,
	BottomSheetBackdrop,
	BottomSheetDragIndicator,
	BottomSheetPortal,
	type BottomSheetRef,
	BottomSheetScrollView,
} from "@/components/ui/bottomsheet";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import {
	type GetV1ComplaintsMapResponses,
	getV1ComplaintsByIdPublic,
} from "@/libs/oikos-sdk";
import {
	type ComplaintStatus,
	type ComplaintType,
	complaintTypeValues,
} from "@/libs/types/complaint";
import { Alert, AlertIcon, AlertText } from "../ui/alert";
import { Badge, BadgeIcon, BadgeText } from "../ui/badge";
import { Divider } from "../ui/divider";
import { Heading } from "../ui/heading";
import { HStack } from "../ui/hstack";
import { VStack } from "../ui/vstack";
import { ComplaintStatusChip } from "./complaint-chip/complaint-status-chip";
import { ComplaintTypeChip } from "./complaint-chip/complaint-type-chip";

export type MapComplaint =
	GetV1ComplaintsMapResponses[200]["complaints"][number];
type Attachment = MapComplaint["captures"][number]["attachments"][number];

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

function formatDistance(km: number): string {
	return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

function getAddress(complaint: MapComplaint): string | null {
	const geo = complaint.captures[0]?.geospatial;
	if (!geo) return null;
	const { street, streetNumber, district } = geo.addresses;
	const streetPart = [street, streetNumber].filter(Boolean).join(", ");
	return [streetPart, district].filter(Boolean).join(" — ") || null;
}

type AttachmentPreviewProps = {
	visible: boolean;
	attachment: Attachment | null;
	onClose: () => void;
};

function AttachmentPreview({
	visible,
	attachment,
	onClose,
}: AttachmentPreviewProps) {
	const insets = useSafeAreaInsets();
	return (
		<Modal
			visible={visible}
			animationType="fade"
			statusBarTranslucent
			onRequestClose={onClose}
		>
			<View className="flex-1 bg-black">
				{attachment?.type === "PHOTO" ? (
					<ImagePreviewViewer uri={attachment.url} />
				) : attachment?.type === "VIDEO" ? (
					<VideoPreviewPlayer uri={attachment.url} />
				) : null}
				<TouchableOpacity
					className="absolute left-4 rounded-xl bg-black/50 p-3"
					style={{ top: insets.top + 8 }}
					onPress={onClose}
				>
					<ArrowLeftIcon size={20} color={colors.white} strokeWidth={2.2} />
				</TouchableOpacity>
			</View>
		</Modal>
	);
}

export type ComplaintBottomSheetProps = {
	isOpen: boolean;
	onClose: () => void;
	complaint: MapComplaint | null;
	currentVote?: "RESOLVED" | "NOT_RESOLVED";
	onVote: (vote: "RESOLVED" | "NOT_RESOLVED") => void;
	isPendingVote?: boolean;
	userLocation?: { lat: number; lon: number } | null;
};

export function ComplaintBottomSheet({
	isOpen,
	onClose,
	complaint,
	currentVote,
	onVote,
	isPendingVote = false,
	userLocation,
}: ComplaintBottomSheetProps) {
	const ref = useRef<BottomSheetRef>(null);
	const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(
		null,
	);

	useEffect(() => {
		if (isOpen) {
			ref.current?.open();
		} else {
			ref.current?.close();
		}
	}, [isOpen]);

	const complaintId = complaint?.id ?? "";
	const { data: detailData } = useQuery({
		queryKey: ["complaint", "public", complaintId],
		queryFn: async () => {
			const res = await getV1ComplaintsByIdPublic({
				path: { id: complaintId },
			});
			return res.data;
		},
		enabled: isOpen && !!complaintId,
	});

	if (!complaint) return null;

	const typeInfo = complaintTypeValues.find(t => t.value === complaint.type);
	const resolutions = detailData?.complaint?.resolutions ?? [];
	const observations =
		detailData?.complaint?.captures
			.map(c => c.observations)
			.filter(Boolean)
			.join(" ") ?? null;

	const allAttachments = complaint.captures.flatMap(c => c.attachments);
	const address = getAddress(complaint);
	const dateLabel = format(
		new Date(complaint.created_at),
		"d 'de' MMMM 'de' yyyy 'às' HH:mm",
		{ locale: ptBR },
	);
	const coords = complaint.location
		? `${complaint.location.lat.toFixed(4)}, ${complaint.location.lon.toFixed(4)}`
		: null;
	const distanceLabel =
		userLocation && complaint.location
			? formatDistance(
					haversineKm(
						userLocation.lat,
						userLocation.lon,
						complaint.location.lat,
						complaint.location.lon,
					),
				)
			: null;

	const resolvedVotes = complaint.vote_counts.resolved;
	const notResolvedVotes = complaint.vote_counts.not_resolved;
	const isResolvedActive = currentVote === "RESOLVED";
	const isNotResolvedActive = currentVote === "NOT_RESOLVED";

	return (
		<>
			<AttachmentPreview
				visible={!!previewAttachment}
				attachment={previewAttachment}
				onClose={() => setPreviewAttachment(null)}
			/>

			<BottomSheet ref={ref} onClose={onClose}>
				<BottomSheetPortal
					snapPoints={["85%"]}
					backdropComponent={BottomSheetBackdrop}
					handleComponent={BottomSheetDragIndicator}
				>
					<BottomSheetScrollView contentContainerStyle={{ paddingBottom: 32 }}>
						{/* Info + actions */}
						<View className={`items-start gap-2.5 px-4`}>
							<View>
								<Badge variant="outline" className="w-min">
									<BadgeText>{complaint.id}</BadgeText>
								</Badge>
							</View>

							{/* Title */}
							<Text
								className="text-xl font-bold text-gray-900"
								style={{ fontFamily: "Oswald_700Bold" }}
								numberOfLines={2}
							>
								{typeInfo?.description?.toLocaleUpperCase() ??
									typeInfo?.label ??
									complaint.type}
							</Text>

							{/* Badges + distance */}
							<HStack className="w-full items-center justify-between">
								<View className="flex-row items-center gap-1.5">
									<ComplaintTypeChip
										type={complaint.type as ComplaintType}
										size="sm"
									/>
									<ComplaintStatusChip
										status={complaint.status as ComplaintStatus}
										size="sm"
									/>
								</View>

								{/* Distance chip */}
								{distanceLabel && (
									<Badge className="flex-row items-center gap-1 rounded-xl bg-gray-100 px-2 py-1">
										<BadgeIcon as={MapPinIcon} className="text-gray-500" />
										<BadgeText className="text-gray-500">
											{distanceLabel}
										</BadgeText>
									</Badge>
								)}
							</HStack>

							{/* Address */}
							{address && (
								<View className="flex-row items-center gap-1.5">
									<MapPinIcon
										size={13}
										color={colors.gray[500]}
										strokeWidth={2}
									/>
									<Text className="flex-1  text-gray-500" numberOfLines={1}>
										{address}
									</Text>
								</View>
							)}

							{/* Date */}
							<View className="flex-row items-center gap-1.5">
								<CalendarIcon
									size={13}
									color={colors.gray[500]}
									strokeWidth={2}
								/>
								<Text className=" text-gray-500">{dateLabel}</Text>
							</View>

							{/* Coordinates */}
							{coords && (
								<View className="flex-row items-center gap-1.5">
									<CrosshairIcon
										size={13}
										color={colors.gray[500]}
										strokeWidth={2}
									/>
									<Text className=" text-gray-500">{coords}</Text>
								</View>
							)}

							{/* Observations */}
							{observations && (
								<Text className="leading-5 text-gray-600">{observations}</Text>
							)}

							{/* Attachment gallery */}
							{/* <VStack className="gap-2"> */}
							<HStack className="gap-2">
								<Heading size="sm">Anexos</Heading>
								<Badge variant="outline">
									<BadgeText>{allAttachments.length}</BadgeText>
								</Badge>
							</HStack>

							{allAttachments.length > 0 && (
								<ScrollView
									horizontal
									showsHorizontalScrollIndicator={false}
									contentContainerClassName="gap-2"
								>
									{allAttachments.map(att => (
										<TouchableOpacity
											key={att.id}
											activeOpacity={0.85}
											onPress={() => setPreviewAttachment(att)}
											className="h-[110px] w-[110px] overflow-hidden rounded-lg bg-gray-100"
										>
											<MediaThumbnail
												mediaType={att.type === "PHOTO" ? "photo" : "video"}
												uri={att.url}
											/>
											{att.type === "VIDEO" && (
												<View className="absolute bottom-1.5 right-1.5 rounded-full bg-black/55 p-1">
													<PlayIcon
														size={12}
														color={colors.white}
														fill={colors.white}
														strokeWidth={0}
													/>
												</View>
											)}
										</TouchableOpacity>
									))}
								</ScrollView>
							)}
							{/* </VStack> */}

							<Divider />

							<VStack className="w-full flex-1 gap-2">
								<VStack className="gap-2">
									<Heading size="sm">Seu voto importa!</Heading>
									<Alert className="flex-row items-start gap-2 rounded-lg border border-sky-700 bg-sky-50 p-3">
										<AlertIcon as={InfoIcon} className="text-sky-700" />
										<AlertText className="text-sky-700">
											Votos trazem uma dinamica, de modo que coloca o poder de
											decisão nas mãos da sociedade. Você votando ajuda a marcar
											essa denúncia como resolvida ou não, ajudando assim uma
											atualização e respostas mais rápida dos orgãos
											competentes.
										</AlertText>
									</Alert>
								</VStack>
								{/* Vote buttons */}
								<HStack className="gap-2">
									{/* Não Resolvida */}
									<TouchableOpacity
										onPress={() => onVote("NOT_RESOLVED")}
										disabled={isPendingVote}
										activeOpacity={0.8}
										className={`h-14 flex-1 items-center justify-center rounded-[10px] ${isNotResolvedActive ? "bg-red-600" : "bg-white"}`}
										style={
											!isNotResolvedActive
												? { borderWidth: 1.5, borderColor: colors.gray[200] }
												: undefined
										}
									>
										{isPendingVote ? (
											<Spinner size="small" />
										) : (
											<>
												<View className="flex-row items-center gap-1.5">
													<ThumbsDownIcon
														size={15}
														color={
															isNotResolvedActive
																? colors.white
																: colors.gray[500]
														}
														strokeWidth={2}
													/>
													<Text
														className={`font-semibold ${isNotResolvedActive ? "text-white" : "text-gray-700"}`}
													>
														Não Resolvida
													</Text>
												</View>
												<Text
													className={`mt-0.5  ${isNotResolvedActive ? "text-red-100" : "text-gray-400"}`}
												>
													{notResolvedVotes} votos
												</Text>
											</>
										)}
									</TouchableOpacity>

									{/* Resolvida */}
									<TouchableOpacity
										onPress={() => onVote("RESOLVED")}
										disabled={isPendingVote}
										activeOpacity={0.8}
										className={`h-14 flex-1 items-center justify-center rounded-[10px] ${isResolvedActive ? "bg-lime-800" : "bg-white"}`}
										style={
											!isResolvedActive
												? { borderWidth: 1.5, borderColor: colors.gray[200] }
												: undefined
										}
									>
										{isPendingVote ? (
											<Spinner size="small" />
										) : (
											<>
												<View className="flex-row items-center gap-1.5">
													<ThumbsUpIcon
														size={15}
														color={
															isResolvedActive ? colors.white : colors.gray[500]
														}
														strokeWidth={2}
													/>
													<Text
														className={`font-semibold ${isResolvedActive ? "text-white" : "text-gray-700"}`}
													>
														Resolvida
													</Text>
												</View>
												<Text
													className={`mt-0.5  ${isResolvedActive ? "text-lime-100" : "text-gray-400"}`}
												>
													{resolvedVotes} votos
												</Text>
											</>
										)}
									</TouchableOpacity>
								</HStack>

								{/* Resolutions list */}
								<VStack className="w-full gap-2">
									<Text className="font-bold text-gray-800">Resoluções</Text>
									<Alert className="flex-row items-start gap-2 rounded-lg border border-amber-700 bg-amber-50 p-3">
										<AlertIcon
											as={AlertTriangleIcon}
											className="text-amber-700"
										/>
										<AlertText className="text-amber-700">
											As resoluções serão públicas, utilize este local apenas
											para postagens íntegras que levarão à resolução da
											denúncia.
										</AlertText>
									</Alert>
									{resolutions.length > 0 &&
										resolutions.map(resolution => (
											<View
												key={resolution.id}
												className="gap-1.5 rounded-[10px] border border-gray-100 p-3"
											>
												<View className="flex-row items-center justify-between">
													<View className="flex-row items-center gap-1.5">
														<View className="h-6 w-6 items-center justify-center rounded-full bg-gray-100">
															{resolution.resolver.type === "company" ? (
																<BuildingIcon
																	size={13}
																	color={colors.gray[500]}
																	strokeWidth={2}
																/>
															) : (
																<UserIcon
																	size={13}
																	color={colors.gray[500]}
																	strokeWidth={2}
																/>
															)}
														</View>
														<Text className="font-semibold text-gray-800">
															{resolution.resolver.type === "company"
																? (resolution.resolver.business_name ??
																	resolution.resolver.corporate_name)
																: (resolution.resolver.display_name ??
																	resolution.resolver.full_name)}
														</Text>
													</View>
													<Text className=" text-gray-400">
														{format(
															new Date(resolution.created_at),
															"d 'de' MMM",
															{ locale: ptBR },
														)}
													</Text>
												</View>
												<Text
													className="text-gray-600"
													style={{ lineHeight: 18 }}
												>
													{resolution.description}
												</Text>
											</View>
										))}
								</VStack>

								{/* Adicionar Resolução */}
								<TouchableOpacity
									activeOpacity={0.85}
									onPress={() => {
										router.push(
											`/(tabs)/complaints/${complaint.id}/resolution`,
										);
										onClose();
									}}
									className="h-11 flex-row items-center justify-center gap-1.5 rounded-[10px] border border-gray-200 bg-white"
								>
									<PlusIcon
										size={15}
										color={colors.gray[700]}
										strokeWidth={2}
									/>
									<Text className="font-semibold text-gray-700">
										Adicionar Resolução
									</Text>
								</TouchableOpacity>
							</VStack>
						</View>
					</BottomSheetScrollView>
				</BottomSheetPortal>
			</BottomSheet>
		</>
	);
}
