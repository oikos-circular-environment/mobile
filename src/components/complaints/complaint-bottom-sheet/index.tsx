import BottomSheet, {
	BottomSheetBackdrop,
	type BottomSheetBackdropProps,
	BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import {
	AlertTriangleIcon,
	ArrowRightIcon,
	InfoIcon,
	LockKeyholeIcon,
	PlayIcon,
	PlusIcon,
	ShieldCheckIcon,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { AuthModal } from "@/components/auth/auth-modal";
import { ProfileCompletionModal } from "@/components/auth/profile-completion-modal";
import { MediaThumbnail } from "@/components/medias-preview/media-thumbnail";
import { colors } from "@/components/style/colors";
import { toast } from "@/components/toast";
import { Alert, AlertIcon, AlertText } from "@/components/ui/alert";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import {
	Modal,
	ModalBackdrop,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
} from "@/components/ui/modal";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useAuthContext } from "@/contexts/auth-context";
import { useGeospatial } from "@/contexts/geospatial-context";
import {
	deleteV1ComplaintsByIdResolutions,
	getV1ComplaintsByIdResolutions,
} from "@/libs/oikos-sdk";
import type { MapComplaintAttachment } from "@/libs/types/complaint";
import { cn } from "@/libs/utils";
import { useComplaintsStore } from "@/stores/complaints-store";
import { ComplaintDetailsHeader } from "../complaint-details-header";
import { ComplaintVote, ComplaintVoteButton } from "../complaint-vote-button";
import { MapComplaintAttachmentPreview } from "./attachment-preview";
import { ResolutionCard } from "./resolution-card";
import { ResolutionCardSkeleton } from "./resolution-card-skeleton";

export function ComplaintBottomSheet() {
	const ref = useRef<BottomSheet>(null);
	const [previewMapComplaintAttachment, setPreviewMapComplaintAttachment] =
		useState<MapComplaintAttachment | null>(null);
	const [
		selectedMapComplaintAttachmentId,
		setSelectedMapComplaintAttachmentId,
	] = useState<string | null>(null);
	const [showAuthModal, setShowAuthModal] = useState(false);
	const [showProfileModal, setShowProfileModal] = useState(false);
	const [showVoteGuide, setShowVoteGuide] = useState(false);
	const { isAuthenticated, needsProfileCompletion } = useAuthContext();
	const { location } = useGeospatial();

	const complaint = useComplaintsStore(s => s.selectedMapComplaint);
	const setSelectedMapComplaint = useComplaintsStore(
		s => s.setSelectedMapComplaint,
	);
	const setResolutionDraft = useComplaintsStore(s => s.setResolutionDraft);

	const queryClient = useQueryClient();
	const isOpen = !!complaint;

	const userLocation = location
		? { lat: location.coords.latitude, lon: location.coords.longitude }
		: null;

	useEffect(() => {
		if (isOpen) {
			ref.current?.snapToIndex(0);
		} else {
			ref.current?.close();
		}
	}, [isOpen]);

	const handleSheetChange = useCallback(
		(index: number) => {
			if (index === -1) {
				setSelectedMapComplaint(null);
			}
		},
		[setSelectedMapComplaint],
	);

	const backdropComponent = useCallback(
		(props: BottomSheetBackdropProps) => (
			<BottomSheetBackdrop
				{...props}
				appearsOnIndex={0}
				disappearsOnIndex={-1}
			/>
		),
		[],
	);

	const complaintId = complaint?.id ?? "";

	useEffect(() => {
		setSelectedMapComplaintAttachmentId(null);
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

	const deleteMutation = useMutation({
		mutationFn: () =>
			deleteV1ComplaintsByIdResolutions({ path: { id: complaintId } }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["complaint", "resolutions", complaintId],
			});
			toast.success("Resolução removida.", "Sua resolução foi excluída.");
		},
		onError: () => {
			toast.error("Erro", "Não foi possível excluir a resolução.");
		},
	});

	const resolutions = resolutionsData?.resolutions ?? [];

	const showResolutionsLocked =
		!isAuthenticated && !!complaint && complaint.resolution_count > 0;

	const allMapComplaintAttachments = complaint?.attachments ?? [];

	const handleAddResolution = () => {
		if (!complaint) return;
		if (!isAuthenticated) {
			setShowAuthModal(true);
			return;
		}
		if (needsProfileCompletion) {
			setShowProfileModal(true);
			return;
		}
		router.push({
			pathname: "/(tabs)/complaints/resolution",
			params: { id: complaint.id },
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

		if (!complaint) return;
		router.push({
			pathname: "/(tabs)/complaints/resolution",
			params: { id: complaint.id },
		});
	};

	return (
		<>
			<MapComplaintAttachmentPreview
				visible={!!previewMapComplaintAttachment}
				attachment={previewMapComplaintAttachment}
				onClose={() => setPreviewMapComplaintAttachment(null)}
			/>

			<BottomSheet
				ref={ref}
				index={-1}
				snapPoints={["85%"]}
				enablePanDownToClose
				backdropComponent={backdropComponent}
				onChange={handleSheetChange}
			>
				<BottomSheetScrollView contentContainerStyle={{ paddingBottom: 32 }}>
					{complaint && (
						<View className="items-start gap-2.5 px-4">
							<ComplaintDetailsHeader
								complaint={complaint}
								userLocation={userLocation}
							/>

							<HStack className="gap-2">
								<Heading size="sm">Anexos</Heading>
								<Badge variant="outline">
									<BadgeText>{allMapComplaintAttachments.length}</BadgeText>
								</Badge>
							</HStack>

							{allMapComplaintAttachments.length > 0 && (
								<ScrollView
									horizontal
									showsHorizontalScrollIndicator={false}
									contentContainerClassName="gap-2"
								>
									{allMapComplaintAttachments.map(att => {
										const isSelected =
											selectedMapComplaintAttachmentId === att.id;
										return (
											<TouchableOpacity
												key={att.id}
												activeOpacity={0.85}
												onPress={() => {
													setPreviewMapComplaintAttachment(att);
													setSelectedMapComplaintAttachmentId(att.id);
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

							<Divider />

							<VStack className="w-full flex-1 gap-2">
								{complaint.status === "RESOLVED" && (
									<Alert className="flex-row items-start gap-2 rounded-lg border border-lime-700 bg-lime-50 p-3">
										<AlertIcon as={ShieldCheckIcon} className="text-lime-700" />
										<AlertText className="text-lime-700">
											Esta denúncia foi encerrada. Não é mais possível registrar
											votos ou adicionar resoluções.
										</AlertText>
									</Alert>
								)}

								<ComplaintVote
									complaintId={complaint.id}
									disabled={complaint.status === "RESOLVED"}
								>
									<VStack className="gap-2">
										<Heading size="sm">Seu voto importa!</Heading>
										<Alert className="flex-row items-start gap-2 rounded-lg border border-sky-700 bg-sky-50 p-3">
											<AlertIcon as={InfoIcon} className="text-sky-700" />
											<AlertText className="text-sky-700">
												Compreenda como seu voto ajuda o ecosistema e como
												funciona nosso sistema de votação e resolução.
											</AlertText>
											<Button
												size="icon"
												variant="ghost"
												className="shadown-none"
												onPress={() => setShowVoteGuide(true)}
											>
												<ButtonIcon
													as={ArrowRightIcon}
													className="text-sky-700"
												/>
											</Button>
										</Alert>
									</VStack>
									<View className="flex-row gap-2">
										<ComplaintVoteButton type="NOT_RESOLVED" />
										<ComplaintVoteButton type="RESOLVED" />
									</View>
								</ComplaintVote>

								<VStack className="w-full gap-2">
									<HStack space="md">
										<Text className="font-bold text-gray-800">Resoluções</Text>
										<Badge variant="secondary">
											<BadgeText>{complaint.resolution_count}</BadgeText>
										</Badge>
									</HStack>
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

									<View className="relative my-4">
										{showResolutionsLocked ? (
											Array.from({
												length: Math.min(complaint.resolution_count, 3),
											}).map((_, i) => <ResolutionCardSkeleton key={i} />)
										) : isLoadingResolutions ? (
											<>
												<ResolutionCardSkeleton />
												<ResolutionCardSkeleton />
											</>
										) : resolutions.length > 0 ? (
											resolutions.map(resolution => (
												<ResolutionCard
													key={resolution.id}
													resolution={resolution}
													isOwnResolution={
														isAuthenticated && resolution.is_owner
													}
													onEdit={() => handleEditResolution(resolution)}
													onDelete={() => deleteMutation.mutate()}
												/>
											))
										) : (
											<Text className="py-4 text-center text-sm text-gray-500">
												Nenhuma resolução cadastrada para esta denúncia.
											</Text>
										)}

										{showResolutionsLocked && (
											<BlurView
												intensity={15}
												tint="light"
												experimentalBlurMethod="dimezisBlurView"
												style={{
													position: "absolute",
													top: 0,
													left: 0,
													right: 0,
													bottom: 0,
													alignItems: "center",
													justifyContent: "center",
													gap: 12,
													borderRadius: 8,
												}}
											>
												<LockKeyholeIcon size={16} color={colors.gray[600]} />
												<Text className="text-center text-sm text-gray-600">
													É preciso estar autenticado para ver as resoluções
												</Text>
												<Button
													className="bg-lime-800"
													onPress={() => {
														setSelectedMapComplaint(null);
														router.push("/(tabs)/(home)/sign-in");
													}}
												>
													<ButtonText className="font-semibold">
														Registrar-se
													</ButtonText>
												</Button>
											</BlurView>
										)}
									</View>
								</VStack>

								<TouchableOpacity
									activeOpacity={0.85}
									onPress={handleAddResolution}
									disabled={complaint.status === "RESOLVED"}
									className={cn(
										"h-11 flex-row items-center justify-center gap-1.5 rounded-[10px] border",
										complaint.status === "RESOLVED"
											? "border-gray-100 bg-gray-50"
											: "border-gray-200 bg-white",
									)}
								>
									<PlusIcon
										size={15}
										color={
											complaint.status === "RESOLVED"
												? colors.gray[300]
												: colors.gray[700]
										}
										strokeWidth={2}
									/>
									<Text
										className={cn(
											"font-semibold",
											complaint.status === "RESOLVED"
												? "text-gray-300"
												: "text-gray-700",
										)}
									>
										Adicionar Resolução
									</Text>
								</TouchableOpacity>
							</VStack>
						</View>
					)}
				</BottomSheetScrollView>
			</BottomSheet>

			<AuthModal
				isOpen={showAuthModal}
				onClose={() => setShowAuthModal(false)}
				description="Para interagir com denúncias você precisa ter uma conta. Cadastre-se gratuitamente e ajude a proteger o meio ambiente."
			/>
			<ProfileCompletionModal
				isOpen={showProfileModal}
				onClose={() => setShowProfileModal(false)}
				description="Para interagir com denúncias você precisa finalizar o seu cadastro."
			/>

			<Modal
				isOpen={showVoteGuide}
				onClose={() => setShowVoteGuide(false)}
				useRNModal
			>
				<ModalBackdrop />
				<ModalContent className="gap-4">
					<ModalHeader>
						<Heading size="xl">Como funciona a votação?</Heading>
					</ModalHeader>
					<ModalBody>
						<VStack className="gap-3">
							<Text>
								Qualquer usuário autenticado pode votar se uma denúncia está
								resolvida ou não. Você pode mudar seu voto a qualquer momento —
								apenas o último voto é considerado.
							</Text>
							<Text>
								O voto do autor da denúncia tem peso 2, enquanto os demais
								usuários têm peso 1.
							</Text>
							<Divider />
							<Heading size="sm">Quórum para resolução</Heading>
							<Text>
								Para uma denúncia ser marcada como resolvida, a diferença entre
								os votos a favor e contra precisa ser de no mínimo 5 votos
								(considerando os pesos).
							</Text>
							<Text>
								Quando esse número é atingido, inicia-se uma janela de 24 horas.
								Durante esse período, outros usuários ainda podem votar contra e
								reverter o processo.
							</Text>
							<Text>
								Após 24 horas sem reversão, a denúncia é automaticamente marcada
								como resolvida. Esse mecanismo garante que a decisão seja justa
								e reflita o consenso da comunidade.
							</Text>
						</VStack>
					</ModalBody>
					<ModalFooter>
						<Button
							className="flex-1 bg-lime-800"
							onPress={() => setShowVoteGuide(false)}
						>
							<ButtonText className="font-semibold">Entendi</ButtonText>
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</>
	);
}
