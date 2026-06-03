import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";
import { router } from "expo-router";
import {
	AlertTriangleIcon,
	CalendarIcon,
	CrosshairIcon,
	InfoIcon,
	MapPinIcon,
	PlayIcon,
	PlusIcon,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { AuthModal } from "@/components/auth/auth-modal";
import { MediaThumbnail } from "@/components/medias-preview/media-thumbnail";
import { colors } from "@/components/style/colors";
import { toast } from "@/components/toast";
import { Alert, AlertIcon, AlertText } from "@/components/ui/alert";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import {
	BottomSheet,
	BottomSheetBackdrop,
	BottomSheetDragIndicator,
	BottomSheetPortal,
	type BottomSheetRef,
	BottomSheetScrollView,
} from "@/components/ui/bottomsheet";
import { Divider } from "@/components/ui/divider";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useAuthContext } from "@/contexts/auth-context";
import { useGeospatial } from "@/contexts/geospatial-context";
import {
	deleteV1ComplaintsByIdResolutions,
	deleteV1ComplaintsByIdVotes,
	getV1ComplaintsByIdResolutions,
	getV1ComplaintsByIdVotes,
	postV1ComplaintsByIdVotes,
} from "@/libs/oikos-sdk";
import {
	type ComplaintStatus,
	type ComplaintType,
	complaintTypeValues,
} from "@/libs/types/complaint";
import { useComplaintsStore } from "@/stores/complaints-store";
import { ComplaintStatusChip } from "../complaint-chip/complaint-status-chip";
import { ComplaintTypeChip } from "../complaint-chip/complaint-type-chip";
import { ComplaintVoteButtons } from "../complaint-vote-buttons";
import { AttachmentPreview } from "./attachment-preview";
import { ResolutionCard } from "./resolution-card";
import { ResolutionCardSkeleton } from "./resolution-card-skeleton";
import type { Attachment } from "./utils";
import { formatDistance, getAddress, haversineKm } from "./utils";

export function ComplaintBottomSheet() {
	const ref = useRef<BottomSheetRef>(null);
	const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(
		null,
	);
	const [selectedAttachmentId, setSelectedAttachmentId] = useState<
		string | null
	>(null);
	const [showAuthModal, setShowAuthModal] = useState(false);
	const { isAuthenticated, user } = useAuthContext();
	const { location } = useGeospatial();

	const complaint = useComplaintsStore(s => s.selectedMapComplaint);
	const setSelectedMapComplaint = useComplaintsStore(
		s => s.setSelectedMapComplaint,
	);
	const userVotes = useComplaintsStore(s => s.userVotes);
	const setVote = useComplaintsStore(s => s.setVote);
	const removeVote = useComplaintsStore(s => s.removeVote);
	const patchSelectedMapComplaintVoteCounts = useComplaintsStore(
		s => s.patchSelectedMapComplaintVoteCounts,
	);
	const setResolutionDraft = useComplaintsStore(s => s.setResolutionDraft);

	const queryClient = useQueryClient();
	const isOpen = !!complaint;
	const onClose = () => setSelectedMapComplaint(null);

	const userLocation = location
		? { lat: location.coords.latitude, lon: location.coords.longitude }
		: null;

	useEffect(() => {
		if (isOpen) {
			ref.current?.open();
		} else {
			ref.current?.close();
		}
	}, [isOpen]);

	const complaintId = complaint?.id ?? "";

	useEffect(() => {
		setSelectedAttachmentId(null);
	}, []);

	const { data: resolutionsData, isLoading: isLoadingResolutions } = useQuery({
		queryKey: ["complaint", "resolutions", complaintId],
		queryFn: async () => {
			const res = await getV1ComplaintsByIdResolutions({
				path: { id: complaintId },
			});
			return res.data;
		},
		enabled: isOpen && !!complaintId,
	});

	const { data: voteData } = useQuery({
		queryKey: ["complaint", "vote", complaintId],
		queryFn: async () => {
			const res = await getV1ComplaintsByIdVotes({ path: { id: complaintId } });
			return res.data;
		},
		enabled: isOpen && !!complaintId && isAuthenticated,
	});

	const deleteMutation = useMutation({
		mutationFn: () =>
			deleteV1ComplaintsByIdResolutions({ path: { id: complaintId } }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["complaint", "resolutions", complaintId],
			});
			queryClient.invalidateQueries({
				queryKey: ["complaint", "public", complaintId],
			});
			toast.success("Resolução removida.", "Sua resolução foi excluída.");
		},
		onError: () => {
			toast.error("Erro", "Não foi possível excluir a resolução.");
		},
	});

	const voteMutation = useMutation({
		mutationFn: async ({
			voteType,
		}: {
			voteType: "RESOLVED" | "NOT_RESOLVED" | null;
			previousVote: "RESOLVED" | "NOT_RESOLVED" | null;
		}) => {
			if (!complaintId) return;
			if (voteType === null) {
				await deleteV1ComplaintsByIdVotes({ path: { id: complaintId } });
			} else {
				await postV1ComplaintsByIdVotes({
					path: { id: complaintId },
					body: { vote_type: voteType },
				});
			}
		},
		onSuccess: (_, { voteType, previousVote }) => {
			if (voteType === null) {
				removeVote(complaintId);
			} else {
				setVote(complaintId, voteType);
			}
			patchSelectedMapComplaintVoteCounts({ previousVote, nextVote: voteType });
		},
		onError: () => toast.error("Erro", "Não foi possível registrar seu voto."),
	});

	useEffect(() => {
		if (!voteData || !complaintId) return;
		if (voteData.vote) {
			setVote(complaintId, voteData.vote.vote_type);
		} else {
			removeVote(complaintId);
		}
	}, [voteData, complaintId, setVote, removeVote]);

	if (!complaint) return null;

	const typeInfo = complaintTypeValues.find(t => t.value === complaint.type);
	const resolutions = resolutionsData?.resolutions ?? [];

	const attachmentObservationMap: Record<string, string | null> =
		Object.fromEntries(
			complaint.attachments.map(a => [a.id, complaint.observations]),
		);

	const selectedObservation = selectedAttachmentId
		? (attachmentObservationMap[selectedAttachmentId] ?? null)
		: null;

	const allAttachments = complaint.attachments;
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

	const currentVote = userVotes[complaintId];
	const resolvedVotes = complaint.vote_counts.resolved;
	const notResolvedVotes = complaint.vote_counts.not_resolved;
	const isResolvedActive = isAuthenticated && currentVote === "RESOLVED";
	const isNotResolvedActive = isAuthenticated && currentVote === "NOT_RESOLVED";

	const handleVotePress = (vote: "RESOLVED" | "NOT_RESOLVED") => {
		if (!isAuthenticated) {
			setShowAuthModal(true);
			return;
		}
		const previous = userVotes[complaintId] ?? null;
		const next = previous === vote ? null : vote;
		voteMutation.mutate({ voteType: next, previousVote: previous });
	};

	const complaintRouteContext = {
		id: complaint.id,
		type: complaint.type,
		status: complaint.status,
		address: getAddress(complaint) ?? "",
		date:
			complaint.created_at instanceof Date
				? complaint.created_at.toISOString()
				: String(complaint.created_at),
	};

	const handleAddResolution = () => {
		if (!isAuthenticated) {
			setShowAuthModal(true);
			return;
		}
		router.push({
			pathname: "/(tabs)/complaints/resolution",
			params: complaintRouteContext,
		});
	};

	const handleEditResolution = (resolution: (typeof resolutions)[number]) => {
		const companyJson = resolution.resolver_company
			? JSON.stringify({
					id: resolution.company_id,
					corporate_name: resolution.resolver_company.corporate_name,
					business_name: resolution.resolver_company.business_name ?? null,
					company_type: "",
					avatar: resolution.resolver_company.avatar_url
						? {
								id: "",
								url: resolution.resolver_company.avatar_url,
								file_name: "",
								path: "",
								created_at: new Date().toISOString(),
							}
						: null,
				})
			: undefined;

		const attachmentsJson =
			resolution.attachments.length > 0
				? JSON.stringify(
						resolution.attachments.map(a => ({
							id: a.id,
							url: a.url,
							file_name: a.file_name,
						})),
					)
				: undefined;

		setResolutionDraft({
			description: resolution.description,
			...(companyJson ? { companyJson } : {}),
			...(attachmentsJson ? { attachmentsJson } : {}),
		});

		router.push({
			pathname: "/(tabs)/complaints/resolution",
			params: complaintRouteContext,
		});
	};

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

								{distanceLabel && (
									<Badge className="flex-row items-center gap-1 rounded-xl bg-gray-100 px-2 py-1">
										<BadgeIcon as={MapPinIcon} className="text-gray-500" />
										<BadgeText className="text-gray-500">
											{distanceLabel}
										</BadgeText>
									</Badge>
								)}
							</HStack>

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

							<View className="flex-row items-center gap-1.5">
								<CalendarIcon
									size={13}
									color={colors.gray[500]}
									strokeWidth={2}
								/>
								<Text className=" text-gray-500">
									{dateLabel} • Aberto à{" "}
									{formatDistanceToNowStrict(complaint.created_at, {
										locale: ptBR,
									})}
								</Text>
							</View>

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

							{complaint.observations && (
								<Text className="leading-5 text-gray-600">
									{complaint.observations}
								</Text>
							)}

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
									{allAttachments.map(att => {
										const isSelected = selectedAttachmentId === att.id;
										return (
											<TouchableOpacity
												key={att.id}
												activeOpacity={0.85}
												onPress={() => {
													setPreviewAttachment(att);
													setSelectedAttachmentId(att.id);
												}}
												className="h-[110px] w-[110px] overflow-hidden rounded-lg bg-gray-100"
												style={
													isSelected
														? { borderWidth: 2, borderColor: colors.lime[700] }
														: undefined
												}
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
										);
									})}
								</ScrollView>
							)}

							<View className="gap-1">
								<Heading size="sm">Observações</Heading>
								<Text
									className={`leading-5 ${selectedObservation ? "text-gray-600" : "text-gray-400"}`}
								>
									{selectedObservation ?? "Sem observações complementares"}
								</Text>
							</View>

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
								<ComplaintVoteButtons
									resolvedVotes={resolvedVotes}
									notResolvedVotes={notResolvedVotes}
									isResolvedActive={isResolvedActive}
									isNotResolvedActive={isNotResolvedActive}
									isPendingVote={voteMutation.isPending}
									onVote={handleVotePress}
								/>

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

									{isLoadingResolutions ? (
										<>
											<ResolutionCardSkeleton />
											<ResolutionCardSkeleton />
										</>
									) : (
										resolutions.map(resolution => {
											const isOwnResolution =
												isAuthenticated &&
												resolution.resolver_company === null &&
												resolution.resolver_user_profile.display_name ===
													user?.profile.display_name;
											return (
												<ResolutionCard
													key={resolution.id}
													resolution={resolution}
													isOwnResolution={isOwnResolution}
													onEdit={() => handleEditResolution(resolution)}
													onDelete={() => deleteMutation.mutate()}
												/>
											);
										})
									)}
								</VStack>

								<TouchableOpacity
									activeOpacity={0.85}
									onPress={handleAddResolution}
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

			<AuthModal
				isOpen={showAuthModal}
				onClose={() => setShowAuthModal(false)}
				description="Para interagir com denúncias você precisa ter uma conta. Cadastre-se gratuitamente e ajude a proteger o meio ambiente."
			/>
		</>
	);
}
