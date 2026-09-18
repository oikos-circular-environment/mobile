import { zodResolver } from "@hookform/resolvers/zod";
import type * as ImagePicker from "expo-image-picker";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { AlertCircleIcon } from "lucide-react-native";
import { useEffect, useState } from "react";
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
import { AddMediaTile } from "@/components/complaints/attachments/add-media-tile";
import { AttachmentThumbnail } from "@/components/complaints/attachments/attachment-thumbnail";
import type { AttachmentMedia } from "@/components/complaints/attachments/types";
import type { Company } from "@/components/complaints/company-picker-bottom-sheet";
import { CompanyPickerBottomSheet } from "@/components/complaints/company-picker-bottom-sheet";
import { ComplaintDetailsHeader } from "@/components/complaints/complaint-details-header";
import { ComplaintAlertBanner } from "@/components/complaints/complaint-form/alert-banner";
import { CompanyPickerField } from "@/components/complaints/complaint-form/company-picker-field";
import { useComplaintForId } from "@/components/complaints/hooks/use-complaint-for-id";
import { useResolutionMutation } from "@/components/complaints/hooks/use-resolution-mutation";
import { MediaUploadProgress } from "@/components/complaints/media-upload-progress";
import { ResolutionDeleteConfirmModal } from "@/components/complaints/resolution-delete-confirm-modal";
import { toast } from "@/components/toast";
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
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { useAuthContext } from "@/contexts/auth-context";
import { usePickValidatedMedia } from "@/hooks/use-pick-validated-media";
import { useRouteInteractive } from "@/hooks/use-route-interactive";
import { mediaTypeFromFileName } from "@/libs/media/validation";
import { useComplaintsStore } from "@/stores/complaints-store";

const MIN_ATTACHMENTS = 1;

const resolutionSchema = z.object({
	description: z.string().min(1, "Descrição é obrigatória."),
});

type ResolutionFormValues = z.infer<typeof resolutionSchema>;

export default function ComplaintResolutionScreen() {
	useRouteInteractive();
	const { id } = useLocalSearchParams<{ id: string }>();
	const insets = useSafeAreaInsets();
	const { isAuthenticated } = useAuthContext();

	const resolutionDraft = useComplaintsStore(s => s.resolutionDraft);
	const clearResolutionDraft = useComplaintsStore(s => s.clearResolutionDraft);

	const isEditMode = !!resolutionDraft;
	const resolutionId = resolutionDraft?.resolutionId;

	const [selectedAssets, setSelectedAssets] = useState<
		ImagePicker.ImagePickerAsset[]
	>([]);
	const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
	const [showCompanyPicker, setShowCompanyPicker] = useState(false);
	const [existingAttachments, setExistingAttachments] = useState<
		AttachmentMedia[]
	>([]);
	const [removedAttachmentIds, setRemovedAttachmentIds] = useState<Set<string>>(
		new Set(),
	);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	useEffect(() => {
		if (!resolutionDraft) return;
		if (resolutionDraft.companyJson) {
			try {
				setSelectedCompany(JSON.parse(resolutionDraft.companyJson) as Company);
			} catch {}
		}
		if (resolutionDraft.attachmentsJson) {
			try {
				setExistingAttachments(
					JSON.parse(resolutionDraft.attachmentsJson) as AttachmentMedia[],
				);
			} catch {}
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

	const complaintForHeader = useComplaintForId(id);

	const { pickValidatedMedia, isPicking } = usePickValidatedMedia();

	const handlePickMedia = async () => {
		const validAssets = await pickValidatedMedia(
			selectedAssets.map(a => a.uri),
			{
				requestPermission: true,
				mediaTypes: ["images", "videos"],
				allowsMultipleSelection: true,
				quality: 0.85,
				orderedSelection: true,
			},
		);
		if (validAssets.length > 0) {
			setSelectedAssets(prev => [...prev, ...validAssets]);
		}
	};

	const handleRemoveAsset = (uri: string) => {
		setSelectedAssets(prev => prev.filter(a => a.uri !== uri));
	};

	const { mutation, deleteMutation, uploadProgress } = useResolutionMutation({
		complaintId: id,
		isEditMode,
		resolutionId,
	});

	const attachmentsMissing = MIN_ATTACHMENTS - selectedAssets.length;
	const canSubmit =
		isAuthenticated &&
		(isEditMode || selectedAssets.length >= MIN_ATTACHMENTS) &&
		!mutation.isPending;

	const onSubmit = (data: ResolutionFormValues) => {
		if (!isEditMode && selectedAssets.length < MIN_ATTACHMENTS) {
			toast.error(
				"Anexos insuficientes",
				`Adicione pelo menos ${MIN_ATTACHMENTS} anexos.`,
			);
			return;
		}

		mutation.mutate({
			description: data.description,
			company: selectedCompany,
			assets: selectedAssets,
			removedAttachmentIds,
		});
	};

	return (
		<>
			<Stack.Screen options={{ title: "Resolução" }} />
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				className="flex-1 bg-white"
			>
				<ScrollView
					className="flex-1 px-4"
					contentContainerStyle={{
						gap: 16,
						paddingBottom: 24,
					}}
					keyboardShouldPersistTaps="handled"
					showsVerticalScrollIndicator={false}
				>
					{complaintForHeader && (
						<View className="mt-4">
							<ComplaintDetailsHeader complaint={complaintForHeader} />
						</View>
					)}

					<ComplaintAlertBanner variant="info" />

					<ComplaintAlertBanner variant="warning" />

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
									<Text className="text-sm text-gray-400">
										{charCount} caracteres
									</Text>
								</View>
								<Input className="min-h-28">
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
								) : null}
							</FormControl>
						)}
					/>

					<FormControl>
						<View className="mb-2 flex-row items-center justify-between">
							<FormControlLabel>
								<FormControlLabelText className="text-base font-bold text-gray-800">
									Empresa responsável
								</FormControlLabelText>
							</FormControlLabel>
							<Text className="text-xs text-gray-400">opcional</Text>
						</View>

						<CompanyPickerField
							company={selectedCompany}
							onPress={() => setShowCompanyPicker(true)}
							onClear={() => setSelectedCompany(null)}
						/>

						<FormControlHelper>
							<FormControlHelperText>
								Vincule uma empresa caso ela tenha participado da resolução.
							</FormControlHelperText>
						</FormControlHelper>
					</FormControl>

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
							<AddMediaTile onPress={handlePickMedia} isPicking={isPicking} />

							{existingAttachments
								.filter(a => !removedAttachmentIds.has(a.id))
								.map(attachment => (
									<AttachmentThumbnail
										key={attachment.id}
										uri={attachment.url}
										mediaType={mediaTypeFromFileName(attachment.file_name)}
										onRemove={() =>
											setRemovedAttachmentIds(prev => {
												const next = new Set(prev);
												next.add(attachment.id);
												return next;
											})
										}
									/>
								))}

							{selectedAssets.map(asset => (
								<AttachmentThumbnail
									key={asset.uri}
									uri={asset.uri}
									mediaType={asset.type === "video" ? "video" : "photo"}
									fileSizeBytes={asset.fileSize}
									onRemove={() => handleRemoveAsset(asset.uri)}
								/>
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

					{isEditMode ? (
						<View
							className="gap-3"
							style={{ marginBottom: insets.bottom || 16 }}
						>
							<View className="flex-row gap-3">
								<TouchableOpacity
									onPress={() => router.back()}
									disabled={mutation.isPending}
									activeOpacity={0.85}
									className="h-12 flex-1 items-center justify-center rounded-xl border border-gray-200"
								>
									<Text className="text-base font-bold text-gray-600">
										Cancelar
									</Text>
								</TouchableOpacity>
								<TouchableOpacity
									onPress={handleSubmit(onSubmit)}
									disabled={!canSubmit}
									activeOpacity={0.85}
									className={`h-12 flex-1 items-center justify-center rounded-xl ${canSubmit ? "bg-lime-800" : "bg-gray-200"}`}
								>
									{mutation.isPending ? (
										<Spinner size="small" />
									) : (
										<Text
											className={`text-base font-bold ${canSubmit ? "text-white" : "text-gray-400"}`}
										>
											Salvar
										</Text>
									)}
								</TouchableOpacity>
							</View>
							<TouchableOpacity
								onPress={() => setShowDeleteConfirm(true)}
								disabled={deleteMutation.isPending}
								activeOpacity={0.85}
								className="h-12 items-center justify-center rounded-xl border border-red-200 bg-red-50"
							>
								{deleteMutation.isPending ? (
									<Spinner size="small" />
								) : (
									<Text className="text-base font-bold text-red-600">
										Deletar Resolução
									</Text>
								)}
							</TouchableOpacity>
						</View>
					) : (
						<TouchableOpacity
							onPress={handleSubmit(onSubmit)}
							disabled={!canSubmit}
							activeOpacity={0.85}
							className={`h-12 items-center justify-center rounded-xl ${canSubmit ? "bg-lime-800" : "bg-gray-200"}`}
							style={{ marginBottom: insets.bottom || 16 }}
						>
							{mutation.isPending ? (
								<Spinner size="small" />
							) : (
								<Text
									className={`text-base font-bold ${canSubmit ? "text-white" : "text-gray-400"}`}
								>
									Confirmar Resolução
								</Text>
							)}
						</TouchableOpacity>
					)}
				</ScrollView>
			</KeyboardAvoidingView>

			<CompanyPickerBottomSheet
				isOpen={showCompanyPicker}
				onClose={() => setShowCompanyPicker(false)}
				onSelect={company => setSelectedCompany(company)}
				selectedCompanyId={selectedCompany?.id}
				disablePortal
			/>

			<ResolutionDeleteConfirmModal
				isOpen={showDeleteConfirm}
				onClose={() => setShowDeleteConfirm(false)}
				onConfirm={() => deleteMutation.mutate()}
				isDeleting={deleteMutation.isPending}
			/>

			<MediaUploadProgress progress={uploadProgress} />
		</>
	);
}
