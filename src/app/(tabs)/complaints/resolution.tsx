import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import {
	AlertCircleIcon,
	AlertTriangleIcon,
	BuildingIcon,
	ChevronDownIcon,
	ImageIcon,
	InfoIcon,
	X,
	XIcon,
} from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	TouchableOpacity,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";
import type { Company } from "@/components/complaints/company-picker-bottom-sheet";
import { CompanyPickerBottomSheet } from "@/components/complaints/company-picker-bottom-sheet";
import { ComplaintDetailsHeader } from "@/components/complaints/complaint-details-header";
import type { UploadProgress } from "@/components/complaints/hooks/upload-progress";
import { MediaUploadProgress } from "@/components/complaints/media-upload-progress";
import { MediaThumbnail } from "@/components/medias-preview/media-thumbnail";
import { colors } from "@/components/style/colors";
import { toast } from "@/components/toast";
import { Alert, AlertIcon, AlertText } from "@/components/ui/alert";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import {
	FormControl,
	FormControlError,
	FormControlErrorIcon,
	FormControlErrorText,
	FormControlHelper,
	FormControlHelperText,
	FormControlLabel,
	FormControlLabelText,
} from "@/components/ui/form-control";
import { Input, InputField } from "@/components/ui/input";
import { Pressable } from "@/components/ui/pressable";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { useAuthContext } from "@/contexts/auth-context";
import { getAuthenticatedImageHeaders } from "@/libs/api/oikos-api";
import { compressMedia } from "@/libs/media-compression";
import {
	formatFileSize,
	getFileSize,
	isValidMimeType,
	MAX_FILE_SIZE_BYTES,
} from "@/libs/media-validation";
import { logComplaintEvent } from "@/libs/observe-events";
import {
	deleteV1ComplaintsByIdResolutionsAttachmentsByAttachmentId,
	patchV1ComplaintsByIdResolutionsByResolutionId,
	postV1ComplaintsByIdResolutions,
	postV1ComplaintsByIdResolutionsAttachments,
} from "@/libs/oikos-sdk";
import { usePickImage } from "@/libs/use-pick-image";
import { useRouteInteractive } from "@/libs/use-route-interactive";
import { useComplaintsStore } from "@/stores/complaints-store";

const MIN_ATTACHMENTS = 1;
const MIN_CHARS = 50;

type ExistingAttachment = { id: string; url: string; file_name: string };

function mediaTypeFromFileName(fileName: string): "photo" | "video" {
	const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
	return ["mp4", "mov", "avi", "webm", "mkv"].includes(ext) ? "video" : "photo";
}

const resolutionSchema = z.object({
	description: z
		.string()
		.min(
			MIN_CHARS,
			`A descrição precisa ter pelo menos ${MIN_CHARS} caracteres.`,
		),
});

type ResolutionFormValues = z.infer<typeof resolutionSchema>;

export default function ComplaintResolutionScreen() {
	useRouteInteractive();
	const { id } = useLocalSearchParams<{ id: string }>();
	const insets = useSafeAreaInsets();
	const { isAuthenticated } = useAuthContext();
	const queryClient = useQueryClient();

	const resolutionDraft = useComplaintsStore(s => s.resolutionDraft);
	const clearResolutionDraft = useComplaintsStore(s => s.clearResolutionDraft);

	const isEditMode = !!resolutionDraft;
	const resolutionId = resolutionDraft?.resolutionId;

	const [selectedAssets, setSelectedAssets] = useState<
		ImagePicker.ImagePickerAsset[]
	>([]);
	type CompressedMedia = { uri: string; name: string; type: string };
	const compressedMediaRef = useRef<CompressedMedia[]>([]);
	const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
		null,
	);
	const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
	const [showCompanyPicker, setShowCompanyPicker] = useState(false);
	const [existingAttachments, setExistingAttachments] = useState<
		ExistingAttachment[]
	>([]);
	const [removedAttachmentIds, setRemovedAttachmentIds] = useState<Set<string>>(
		new Set(),
	);

	useEffect(() => {
		if (!resolutionDraft) return;
		if (resolutionDraft.companyJson) {
			try {
				setSelectedCompany(JSON.parse(resolutionDraft.companyJson) as Company);
			} catch {
				// ignore malformed JSON
			}
		}
		if (resolutionDraft.attachmentsJson) {
			try {
				setExistingAttachments(
					JSON.parse(resolutionDraft.attachmentsJson) as ExistingAttachment[],
				);
			} catch {
				// ignore malformed JSON
			}
		}
		return () => clearResolutionDraft();
	}, [resolutionDraft, clearResolutionDraft]);

	const {
		control,
		handleSubmit,
		watch,
		formState: { errors },
	} = useForm<ResolutionFormValues>({
		resolver: zodResolver(resolutionSchema),
		defaultValues: { description: resolutionDraft?.description ?? "" },
		mode: "onTouched",
	});

	const description = watch("description");
	const charCount = description.length;

	const selectedMapComplaint = useComplaintsStore(s => s.selectedMapComplaint);
	const complaintsInList = useComplaintsStore(s => s.complaints);

	const complaintForHeader = useMemo(() => {
		if (selectedMapComplaint?.id === id) return selectedMapComplaint;
		const found = complaintsInList.find(c => c.id === id);
		if (!found) return null;
		const coords = found.geospatial.location.coords;
		return {
			...found,
			location: { lat: coords.latitude, lon: coords.longitude },
		};
	}, [selectedMapComplaint, complaintsInList, id]);

	const { pickImage, isPicking } = usePickImage();

	const handlePickMedia = async () => {
		const assets = await pickImage({
			requestPermission: true,
			mediaTypes: ["images", "videos"],
			allowsMultipleSelection: true,
			quality: 0.85,
			orderedSelection: true,
		});
		if (!assets) return;

		const existingUris = new Set(selectedAssets.map(a => a.uri));
		const validAssets: ImagePicker.ImagePickerAsset[] = [];
		let skippedCount = 0;

		for (const asset of assets) {
			if (existingUris.has(asset.uri)) continue;
			if (!isValidMimeType(asset.mimeType)) {
				skippedCount++;
				continue;
			}
			validAssets.push(asset);
		}

		if (validAssets.length > 0) {
			setSelectedAssets(prev => [...prev, ...validAssets]);
		}

		if (skippedCount > 0) {
			toast.warning(
				"Arquivos ignorados",
				`${skippedCount} arquivo(s) com formato não suportado. Use JPEG, PNG, MP4, MOV ou WEBM.`,
			);
		}
	};

	const handleRemoveAsset = (uri: string) => {
		setSelectedAssets(prev => prev.filter(a => a.uri !== uri));
	};

	const mutation = useMutation({
		mutationFn: async (data: ResolutionFormValues) => {
			if (!id) throw new Error("Dados inválidos.");

			if (isEditMode && resolutionId) {
				await patchV1ComplaintsByIdResolutionsByResolutionId({
					path: { id, resolutionId },
					body: {
						description: data.description,
						...(selectedCompany ? { company_id: selectedCompany.id } : {}),
					},
				});
				for (const attachmentId of removedAttachmentIds) {
					await deleteV1ComplaintsByIdResolutionsAttachmentsByAttachmentId({
						path: { id, attachmentId },
					});
				}
			} else {
				await postV1ComplaintsByIdResolutions({
					path: { id },
					body: {
						description: data.description,
						...(selectedCompany ? { company_id: selectedCompany.id } : {}),
					},
				});
			}

			const mediaList = compressedMediaRef.current;
			for (let i = 0; i < mediaList.length; i++) {
				const media = mediaList[i];
				setUploadProgress({
					phase: "uploading",
					current: i + 1,
					total: mediaList.length,
				});
				const formData = new FormData();
				formData.append("file", {
					uri: media.uri,
					name: media.name,
					type: media.type,
				} as unknown as Blob);
				await postV1ComplaintsByIdResolutionsAttachments({
					path: { id },
					body: formData as unknown as undefined,
				});
			}
		},
		onSuccess: () => {
			setUploadProgress(null);
			queryClient.invalidateQueries({
				queryKey: ["complaint", "resolutions", id],
			});
			logComplaintEvent("complaint.resolved", {
				success: true,
				action: isEditMode ? "updated" : "created",
			});
			toast.success(
				isEditMode ? "Resolução atualizada!" : "Resolução publicada!",
				isEditMode
					? "Sua resolução foi atualizada."
					: "Sua resolução foi registrada.",
			);
			router.back();
		},
		onError: () => {
			setUploadProgress(null);
			logComplaintEvent("complaint.resolved", {
				success: false,
				action: isEditMode ? "updated" : "created",
			});
			toast.error(
				"Erro",
				`Não foi possível ${isEditMode ? "atualizar" : "publicar"} a resolução.`,
			);
		},
	});

	const attachmentsMissing = MIN_ATTACHMENTS - selectedAssets.length;
	const canSubmit =
		isAuthenticated &&
		(isEditMode || selectedAssets.length >= MIN_ATTACHMENTS) &&
		!mutation.isPending;

	const onSubmit = async (data: ResolutionFormValues) => {
		if (!isEditMode && selectedAssets.length < MIN_ATTACHMENTS) {
			toast.error(
				"Anexos insuficientes",
				`Adicione pelo menos ${MIN_ATTACHMENTS} anexos.`,
			);
			return;
		}

		try {
			setUploadProgress({
				phase: "compressing",
				current: 0,
				total: selectedAssets.length,
			});

			const compressed: CompressedMedia[] = [];
			for (let i = 0; i < selectedAssets.length; i++) {
				const asset = selectedAssets[i];
				setUploadProgress({
					phase: "compressing",
					current: i + 1,
					total: selectedAssets.length,
				});
				const isPhoto = asset.type === "image";
				const ext = isPhoto ? "jpg" : "mp4";
				const compressedUri = await compressMedia(
					asset.uri,
					isPhoto ? "photo" : "video",
				);
				const size = getFileSize(compressedUri);
				if (size != null && size > MAX_FILE_SIZE_BYTES) {
					toast.error(
						"Arquivo muito grande",
						`Um arquivo excede ${formatFileSize(MAX_FILE_SIZE_BYTES)} após compressão. Reduza a qualidade ou duração.`,
					);
					return;
				}
				compressed.push({
					uri: compressedUri,
					name: asset.fileName ?? `resolution_${id}_${Date.now()}.${ext}`,
					type: isPhoto ? "image/jpeg" : "video/mp4",
				});
			}
			compressedMediaRef.current = compressed;
			mutation.mutate(data);
		} catch {
			setUploadProgress(null);
		}
	};

	return (
		<>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				className="flex-1 bg-white"
			>
				<ScrollView
					className="flex-1 px-4"
					contentContainerStyle={{
						paddingTop: insets.top,
						gap: 16,
						paddingBottom: 24,
					}}
					keyboardShouldPersistTaps="handled"
					showsVerticalScrollIndicator={false}
				>
					{/* Header — dados da denúncia */}
					<View className="gap-2 mt-8">
						<View className="flex-1 items-center justify-center">
							<View className="w-8 h-1 bg-gray-500 rounded-sm" />
						</View>
						{complaintForHeader && (
							<ComplaintDetailsHeader complaint={complaintForHeader} />
						)}
					</View>

					{/* Info contextual */}
					<Alert className="flex-row items-start gap-2 rounded-lg border border-sky-700 bg-sky-50 p-3">
						<AlertIcon as={InfoIcon} className="text-sky-700" />
						<AlertText className="flex-1 text-sky-700">
							Deixe a comunidade saber quem resolveu e como resolveu, assim
							conseguimos inspirar voluntários e órgãos competentes a ajudarem
							na solução de um ambiente mais limpo e seguro.
						</AlertText>
					</Alert>

					{/* Aviso de publicidade */}
					<Alert className="flex-row items-start gap-2 rounded-lg border border-amber-500 bg-amber-50 p-3">
						<AlertIcon as={AlertTriangleIcon} className="text-amber-600" />
						<AlertText className="flex-1 text-amber-700">
							As resoluções serão públicas, utilize este local apenas para
							postagens íntegras que levarão à resolução da denúncia.
						</AlertText>
					</Alert>

					{/* Descrição */}
					<Controller
						control={control}
						name="description"
						render={({ field: { onChange, onBlur, value } }) => (
							<FormControl isInvalid={!!errors.description}>
								<View className="mb-2 flex-row items-center justify-between">
									<FormControlLabel>
										<FormControlLabelText className="text-base font-bold text-gray-800">
											Descrição
										</FormControlLabelText>
									</FormControlLabel>
									<Text
										className={`text-sm ${charCount >= MIN_CHARS ? "text-lime-700" : "text-gray-400"}`}
									>
										{charCount} caracteres
									</Text>
								</View>
								<Input className="min-h-[100px]">
									<InputField
										value={value}
										onChangeText={onChange}
										onBlur={onBlur}
										placeholder="Descreva como a denúncia foi resolvida..."
										multiline
										numberOfLines={4}
										textAlignVertical="top"
										maxLength={1000}
									/>
								</Input>
								{errors.description ? (
									<FormControlError>
										<FormControlErrorIcon as={AlertCircleIcon} />
										<FormControlErrorText>
											{errors.description.message}
										</FormControlErrorText>
									</FormControlError>
								) : (
									<FormControlHelper>
										<FormControlHelperText>
											Mínimo de {MIN_CHARS} caracteres.
										</FormControlHelperText>
									</FormControlHelper>
								)}
							</FormControl>
						)}
					/>

					{/* Empresa vinculada (opcional) */}
					<FormControl>
						<View className="mb-2 flex-row items-center justify-between">
							<FormControlLabel>
								<FormControlLabelText className="text-base font-bold text-gray-800">
									Empresa responsável
								</FormControlLabelText>
							</FormControlLabel>
							<Text className="text-xs text-gray-400">opcional</Text>
						</View>

						{selectedCompany ? (
							<View className="flex-row items-center gap-3 rounded-xl border border-lime-700 bg-lime-50 p-3">
								<Avatar size="sm" className="h-9 w-9 rounded-full bg-lime-100">
									<BuildingIcon
										size={16}
										color={colors.lime[800]}
										strokeWidth={2}
									/>
									{selectedCompany.avatar?.url && (
										<AvatarImage
											source={{
												uri: selectedCompany.avatar.url,
												headers: getAuthenticatedImageHeaders(),
											}}
										/>
									)}
								</Avatar>
								<View className="flex-1">
									<Text className="font-semibold text-lime-900">
										{selectedCompany.business_name ??
											selectedCompany.corporate_name}
									</Text>
									<Text className="text-xs text-lime-700">
										{selectedCompany.company_type}
									</Text>
								</View>
								<TouchableOpacity
									onPress={() => setSelectedCompany(null)}
									hitSlop={8}
								>
									<XIcon size={16} color={colors.lime[800]} strokeWidth={2} />
								</TouchableOpacity>
							</View>
						) : (
							<TouchableOpacity
								onPress={() => setShowCompanyPicker(true)}
								activeOpacity={0.8}
								className="h-11 flex-row items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4"
							>
								<Text className="text-sm text-gray-400">
									Selecionar empresa...
								</Text>
								<ChevronDownIcon
									size={16}
									color={colors.gray[400]}
									strokeWidth={2}
								/>
							</TouchableOpacity>
						)}

						<FormControlHelper>
							<FormControlHelperText>
								Vincule uma empresa caso ela tenha participado da resolução.
							</FormControlHelperText>
						</FormControlHelper>
					</FormControl>

					{/* Anexos */}
					<FormControl
						isInvalid={
							!isEditMode && selectedAssets.length > 0 && attachmentsMissing > 0
						}
					>
						<View className="mb-2 flex-row items-center justify-between">
							<FormControlLabel>
								<FormControlLabelText className="text-base font-bold text-gray-800">
									Anexos
								</FormControlLabelText>
							</FormControlLabel>
							{!isEditMode && (
								<Text
									className={`text-sm ${selectedAssets.length >= MIN_ATTACHMENTS ? "text-lime-700" : "text-gray-400"}`}
								>
									{selectedAssets.length}/{MIN_ATTACHMENTS} mínimo
								</Text>
							)}
						</View>

						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerClassName="gap-2 my-2"
							nestedScrollEnabled
							keyboardShouldPersistTaps="always"
						>
							<Pressable
								onPress={handlePickMedia}
								disabled={isPicking}
								className="items-center justify-center rounded-xl border border-gray-200 bg-gray-50"
								style={{ width: 80, height: 80 }}
							>
								{isPicking ? (
									<Spinner color={colors.gray[400]} />
								) : (
									<ImageIcon
										size={24}
										color={colors.gray[400]}
										strokeWidth={1.5}
									/>
								)}
							</Pressable>

							{/* Anexos existentes do servidor */}
							{existingAttachments
								.filter(a => !removedAttachmentIds.has(a.id))
								.map(attachment => (
									<View
										key={attachment.id}
										className="relative"
										style={{ width: 80, height: 80 }}
									>
										<View className="flex-1 overflow-hidden rounded-xl">
											<MediaThumbnail
												mediaType={mediaTypeFromFileName(attachment.file_name)}
												uri={attachment.url}
												fallbackLabel={
													mediaTypeFromFileName(attachment.file_name) ===
													"video"
														? "VÍD"
														: "IMG"
												}
											/>
										</View>
										<TouchableOpacity
											className="absolute -right-1 -top-1 items-center justify-center rounded-full bg-red-500 p-0.5"
											onPress={() =>
												setRemovedAttachmentIds(prev => {
													const next = new Set(prev);
													next.add(attachment.id);
													return next;
												})
											}
										>
											<X size={12} color={colors.white} strokeWidth={2.5} />
										</TouchableOpacity>
									</View>
								))}

							{/* Novos anexos selecionados localmente */}
							{selectedAssets.map(asset => (
								<View
									key={asset.uri}
									className="relative"
									style={{ width: 80, height: 80 }}
								>
									<View className="flex-1 overflow-hidden rounded-xl">
										<MediaThumbnail
											mediaType={asset.type === "video" ? "video" : "photo"}
											uri={asset.uri}
											fallbackLabel={asset.type === "video" ? "VÍD" : "IMG"}
											fileSizeBytes={asset.fileSize}
										/>
									</View>
									<TouchableOpacity
										className="absolute -right-1 -top-1 items-center justify-center rounded-full bg-red-500 p-0.5"
										onPress={() => handleRemoveAsset(asset.uri)}
									>
										<X size={12} color={colors.white} strokeWidth={2.5} />
									</TouchableOpacity>
								</View>
							))}
						</ScrollView>

						{!isEditMode &&
						attachmentsMissing > 0 &&
						selectedAssets.length > 0 ? (
							<FormControlError>
								<FormControlErrorIcon as={AlertCircleIcon} />
								<FormControlErrorText>
									Adicione mais {attachmentsMissing}{" "}
									{attachmentsMissing === 1 ? "anexo" : "anexos"}.
								</FormControlErrorText>
							</FormControlError>
						) : (
							<FormControlHelper>
								<FormControlHelperText>
									{isEditMode
										? "Remova ou adicione novos anexos à resolução."
										: `Mínimo de ${MIN_ATTACHMENTS} anexos (fotos ou vídeos).`}
								</FormControlHelperText>
							</FormControlHelper>
						)}
					</FormControl>

					<TouchableOpacity
						onPress={handleSubmit(onSubmit)}
						disabled={!canSubmit}
						activeOpacity={0.85}
						className={`h-12 items-center justify-center rounded-[10px] ${canSubmit ? "bg-lime-800" : "bg-gray-200"}`}
						style={{ marginBottom: insets.bottom || 16 }}
					>
						{mutation.isPending ? (
							<Spinner size="small" />
						) : (
							<Text
								className={`text-[15px] font-bold ${canSubmit ? "text-white" : "text-gray-400"}`}
							>
								{isEditMode ? "Atualizar Resolução" : "Confirmar Resolução"}
							</Text>
						)}
					</TouchableOpacity>
				</ScrollView>
			</KeyboardAvoidingView>

			<CompanyPickerBottomSheet
				isOpen={showCompanyPicker}
				onClose={() => setShowCompanyPicker(false)}
				onSelect={company => setSelectedCompany(company)}
				selectedCompanyId={selectedCompany?.id}
				disablePortal
			/>

			<MediaUploadProgress progress={uploadProgress} />
		</>
	);
}
