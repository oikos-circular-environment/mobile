import { getV1ComplaintsByIdResolutions } from "@oikos-circular-environment/oikos-sdk";
import { useQuery } from "@tanstack/react-query";
import { BlurTargetView, BlurView } from "expo-blur";
import { router, Stack, useLocalSearchParams } from "expo-router";
import {
	AlertTriangleIcon,
	ArrowRightIcon,
	ChevronLeftIcon,
	InfoIcon,
	LockKeyholeIcon,
	PlayIcon,
	PlusIcon,
	ShieldCheckIcon,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
	Platform,
	Pressable,
	ScrollView,
	TouchableOpacity,
	View,
} from "react-native";
import { AuthModal } from "@/components/auth/auth-modal";
import { ProfileCompletionModal } from "@/components/auth/profile-completion-modal";
import { MapComplaintAttachmentPreview } from "@/components/complaints/complaint-attachment-preview";
import { ComplaintDetailsHeader } from "@/components/complaints/complaint-details-header";
import {
	ComplaintVote,
	ComplaintVoteButton,
} from "@/components/complaints/complaint-vote-button";
import { useComplaintForId } from "@/components/complaints/hooks/use-complaint-for-id";
import { ResolutionCard } from "@/components/complaints/resolution-card";
import { ResolutionCardSkeleton } from "@/components/complaints/resolution-card-skeleton";
import { MediaThumbnail } from "@/components/medias-preview/media-thumbnail";
import { colors } from "@/components/style/colors";
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
import { useRouteInteractive } from "@/hooks/use-route-interactive";
import type { MapComplaintAttachment } from "@/libs/types/complaint";
import { uiEventBus } from "@/libs/ui-event-bus";
import { cn } from "@/libs/utils";
import { useComplaintsStore } from "@/stores/complaints-store";

export default function ComplaintDetailScreen() {
	useRouteInteractive();
	const { id, source } = useLocalSearchParams<{
		id: string;
		source?: string;
	}>();
	const eventSource: "map" | "list" = source === "list" ? "list" : "map";
	const [previewMapComplaintAttachment, setPreviewMapComplaintAttachment] =
		useState<MapComplaintAttachment | null>(null);
	const [
		selectedMapComplaintAttachmentId,
		setSelectedMapComplaintAttachmentId,
	] = useState<string | null>(null);
	const [showAuthModal, setShowAuthModal] = useState(false);
	const [showProfileModal, setShowProfileModal] = useState(false);
	const [showVoteGuide, setShowVoteGuide] = useState(false);
	const resolutionBlurTargetRef = useRef<View | null>(null);
	const { isAuthenticated, needsProfileCompletion } = useAuthContext();
	const { location } = useGeospatial();

	const complaint = useComplaintForId(id);
	const setSelectedMapComplaint = useComplaintsStore(
		s => s.setSelectedMapComplaint,
	);
	const setResolutionDraft = useComplaintsStore(s => s.setResolutionDraft);

	const userLocation = location
		? { lat: location.coords.latitude, lon: location.coords.longitude }
		: null;

	useEffect(() => {
		uiEventBus.emit({
			name: "complaint.opened",
			payload: { source: eventSource },
		});
	}, [eventSource]);

	useEffect(
		() => () => setSelectedMapComplaint(null),
		[setSelectedMapComplaint],
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
		enabled: !!complaintId && isAuthenticated,
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
			pathname: "/(tabs)/complaints/[id]/resolution",
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
			resolutionId: resolution.id,
			description: resolution.description,
			...(companyJson ? { companyJson } : {}),
			...(attachmentsJson ? { attachmentsJson } : {}),
		});

		if (!complaint) return;
		router.push({
			pathname: "/(tabs)/complaints/[id]/resolution",
			params: { id: complaint.id },
		});
	};

	return (
		<View className="flex-1 bg-white">
			<Stack.Screen
				options={{
					title: "Descarte Irregular",
					headerLeft: () => (
						<Pressable onPress={() => router.back()} className="pl-1">
							<ChevronLeftIcon size={24} color={colors.gray[950]} />
						</Pressable>
					),
				}}
			/>
			<ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
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
											className="h-28 w-28 overflow-hidden rounded-lg bg-gray-100"
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
										As resoluções serão públicas, utilize este local apenas para
										postagens íntegras que levarão à resolução da denúncia.
									</AlertText>
								</Alert>

								<View className="relative my-4 gap-4">
									{showResolutionsLocked ? (
										<BlurTargetView ref={resolutionBlurTargetRef}>
											<View className="flex-col gap-4">
												{Array.from({
													length: Math.min(complaint.resolution_count, 3),
												}).map((_, i) => (
													<ResolutionCardSkeleton key={i} />
												))}
											</View>
										</BlurTargetView>
									) : isLoadingResolutions ? (
										<View className="flex-col gap-4">
											<ResolutionCardSkeleton />
											<ResolutionCardSkeleton />
										</View>
									) : resolutions.length > 0 ? (
										resolutions.map(resolution => (
											<ResolutionCard
												key={resolution.id}
												resolution={resolution}
												isOwnResolution={isAuthenticated && resolution.is_owner}
												onEdit={() => handleEditResolution(resolution)}
											/>
										))
									) : (
										<Text className="py-4 text-center text-sm text-gray-500">
											Nenhuma resolução cadastrada para esta denúncia.
										</Text>
									)}

									{showResolutionsLocked && (
										<BlurView
											blurTarget={resolutionBlurTargetRef}
											intensity={15}
											tint="light"
											blurMethod={
												Platform.OS === "android" ? "none" : "dimezisBlurView"
											}
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
												overflow: "hidden",
											}}
										>
											<LockKeyholeIcon size={16} color={colors.gray[600]} />
											<Text className="text-center text-sm text-gray-600">
												É preciso estar autenticado para ver as resoluções.
											</Text>
											<Button
												className="bg-lime-800"
												onPress={() => {
													setSelectedMapComplaint(null);
													router.push("/(tabs)/(home)/sign-in");
												}}
											>
												<ButtonText className="font-semibold">
													Iniciar sessão
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
									"h-11 flex-row items-center justify-center gap-1.5 rounded-xl border",
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
			</ScrollView>

			<MapComplaintAttachmentPreview
				visible={!!previewMapComplaintAttachment}
				attachment={previewMapComplaintAttachment}
				onClose={() => setPreviewMapComplaintAttachment(null)}
			/>

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
		</View>
	);
}
