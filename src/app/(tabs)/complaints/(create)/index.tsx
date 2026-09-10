import { zodResolver } from "@hookform/resolvers/zod";
import * as Crypto from "expo-crypto";
import { router, useIsFocused } from "expo-router";
import {
	AlertCircleIcon,
	CameraIcon,
	ImageIcon,
	ShieldAlertIcon,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
	InteractionManager,
	KeyboardAvoidingView,
	ScrollView,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";
import { AttachmentDeleteConfirmModal } from "@/components/complaints/attachments/attachment-delete-confirm-modal";
import { AttachmentThumbnail } from "@/components/complaints/attachments/attachment-thumbnail";
import { AddressFormFields } from "@/components/complaints/complaint-form/address-form-fields";
import { SectionHeader } from "@/components/complaints/complaint-form/section-header";
import { WasteCategorySelector } from "@/components/complaints/complaint-form/waste-category-selector";
import type { UploadProgress } from "@/components/complaints/hooks/upload-progress";
import { useAttachmentRemove } from "@/components/complaints/hooks/use-attachment-remove";
import { useEditComplaint } from "@/components/complaints/hooks/use-edit-complaint";
import type { MediaItem } from "@/components/complaints/hooks/use-submit-complaints";
import { useSubmitComplaints } from "@/components/complaints/hooks/use-submit-complaints";
import { MediaUploadProgress } from "@/components/complaints/media-upload-progress";
import { GooglePlacesInput } from "@/components/google-places-input";
import { colors } from "@/components/style/colors";
import { toast } from "@/components/toast";
import {
	Button,
	ButtonIcon,
	ButtonSpinner,
	ButtonText,
} from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Divider } from "@/components/ui/divider";
import {
	FormControl,
	FormControlError,
	FormControlErrorIcon,
	FormControlErrorText,
	FormControlLabel,
	FormControlLabelText,
} from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { Input, InputField } from "@/components/ui/input";
import { MapSkeleton } from "@/components/ui/map-skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import WrapperMap from "@/components/wrapper-map";
import { useComplaintCreation } from "@/contexts/complaint-creation-context";
import { useGeospatial } from "@/contexts/geospatial-context";
import { useCepLookup } from "@/hooks/use-cep-lookup";
import { usePickValidatedMedia } from "@/hooks/use-pick-validated-media";
import { useRouteInteractive } from "@/hooks/use-route-interactive";
import {
	type GoogleAddressFields,
	reverseGeocode,
} from "@/libs/google/reverse-geocode";
import { mask } from "@/libs/mask";
import { compressMedia } from "@/libs/media-compression";
import {
	formatFileSize,
	getFileSize,
	MAX_FILE_SIZE_BYTES,
} from "@/libs/media-validation";
import type { Geospatial } from "@/libs/types/complaint";

const schema = z.object({
	observations: z.string().max(500, "Máximo de 500 caracteres.").optional(),
	postalCode: z.string().regex(/^\d{5}-\d{3}$/, "CEP inválido."),
	street: z.string().min(2, "Informe a rua."),
	streetNumber: z.string().min(1, "Informe o número."),
	district: z.string().min(2, "Informe o bairro."),
	city: z.string().min(2, "Informe a cidade."),
	region: z.string().length(2, "Use a sigla com 2 letras (ex: SP)."),
	latitude: z
		.string()
		.min(1, "Informe a latitude.")
		.refine(v => !Number.isNaN(parseFloat(v)), "Latitude inválida."),
	longitude: z
		.string()
		.min(1, "Informe a longitude.")
		.refine(v => !Number.isNaN(parseFloat(v)), "Longitude inválida."),
});

type FormValues = z.infer<typeof schema>;

export default function ComplaintCreateScreen() {
	useRouteInteractive();
	const insets = useSafeAreaInsets();
	const isFocused = useIsFocused();
	const [shouldMountMap, setShouldMountMap] = useState(false);
	const { location, heading, addresses } = useGeospatial();
	const {
		attachments,
		editingComplaint,
		addAttachment,
		clearDraft,
		exitEditMode,
	} = useComplaintCreation();
	const hasAutoFilled = useRef(false);

	const { lookupCep, isLookingUpCep } = useCepLookup();
	const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
	const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
	const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
		null,
	);

	const { mutateAsync: submitComplaint, isPending: isSubmitting } =
		useSubmitComplaints();
	const { mutateAsync: editComplaint, isPending: isEditing } =
		useEditComplaint();
	const isPending = isSubmitting || isEditing;

	const {
		handleRemove,
		pendingDelete,
		confirmDelete,
		cancelDelete,
		isDeleting,
	} = useAttachmentRemove(editingComplaint?.id);

	const {
		control,
		handleSubmit,
		setValue,
		watch,
		reset,
		formState: { errors, isDirty },
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			observations: "",
			postalCode: "",
			street: "",
			streetNumber: "",
			district: "",
			city: "",
			region: "",
			latitude: "",
			longitude: "",
		},
	});

	const latValue = watch("latitude");
	const lonValue = watch("longitude");

	// Pre-fill form from existing complaint in edit mode
	useEffect(() => {
		if (!editingComplaint) return;
		hasAutoFilled.current = true;
		const g = editingComplaint.geospatial;
		reset({
			observations: editingComplaint.observations ?? "",
			postalCode: mask.cep(g.addresses.postalCode ?? ""),
			street: g.addresses.street ?? "",
			streetNumber: g.addresses.streetNumber ?? "",
			district: g.addresses.district ?? "",
			city: g.addresses.city ?? "",
			region: g.addresses.region ?? "",
			latitude: String(g.location.coords.latitude),
			longitude: String(g.location.coords.longitude),
		});
		setSelectedCategoryIds(editingComplaint.categories.map(c => c.id));
	}, [editingComplaint, reset]);

	// Auto-fill from device geolocation (create mode only)
	useEffect(() => {
		if (hasAutoFilled.current) return;
		if (!location && addresses.length === 0) return;

		hasAutoFilled.current = true;

		if (location) {
			setValue("latitude", String(location.coords.latitude));
			setValue("longitude", String(location.coords.longitude));
		}
		if (addresses[0]) {
			if (addresses[0].street) setValue("street", addresses[0].street ?? "");
			if (addresses[0].streetNumber)
				setValue("streetNumber", addresses[0].streetNumber ?? "");
			if (addresses[0].district)
				setValue("district", addresses[0].district ?? "");
			if (addresses[0].city) setValue("city", addresses[0].city ?? "");
			if (addresses[0].region) setValue("region", addresses[0].region ?? "");
			if (addresses[0].postalCode)
				setValue("postalCode", mask.cep(addresses[0].postalCode ?? ""));
		}
	}, [location, addresses, setValue]);

	// Clear edit state if user navigates away without saving
	useEffect(() => {
		return () => exitEditMode();
	}, [exitEditMode]);

	useEffect(() => {
		if (!isFocused) return;
		const task = InteractionManager.runAfterInteractions(() => {
			setShouldMountMap(true);
		});
		return () => task.cancel();
	}, [isFocused]);

	const handleAddressSelect = useCallback(
		(fields: GoogleAddressFields) => {
			if (fields.street)
				setValue("street", fields.street, { shouldValidate: true });
			if (fields.streetNumber)
				setValue("streetNumber", fields.streetNumber, { shouldValidate: true });
			if (fields.district)
				setValue("district", fields.district, { shouldValidate: true });
			if (fields.city) setValue("city", fields.city, { shouldValidate: true });
			if (fields.region)
				setValue("region", fields.region, { shouldValidate: true });
			if (fields.postalCode)
				setValue("postalCode", fields.postalCode, { shouldValidate: true });
			setValue("latitude", fields.latitude, { shouldValidate: true });
			setValue("longitude", fields.longitude, { shouldValidate: true });
		},
		[setValue],
	);

	const handleMapChange = useCallback(
		async (loc: { latitude: number; longitude: number }) => {
			setValue("latitude", String(loc.latitude), { shouldValidate: true });
			setValue("longitude", String(loc.longitude), { shouldValidate: true });

			setIsReverseGeocoding(true);
			try {
				const address = await reverseGeocode(loc.latitude, loc.longitude);
				if (!address) return;
				if (address.street)
					setValue("street", address.street, { shouldValidate: true });
				if (address.streetNumber)
					setValue("streetNumber", address.streetNumber, {
						shouldValidate: true,
					});
				if (address.district)
					setValue("district", address.district, { shouldValidate: true });
				if (address.city)
					setValue("city", address.city, { shouldValidate: true });
				if (address.region)
					setValue("region", address.region, { shouldValidate: true });
				if (address.postalCode)
					setValue("postalCode", address.postalCode, { shouldValidate: true });
			} finally {
				setIsReverseGeocoding(false);
			}
		},
		[setValue],
	);

	const handleCepLookup = useCallback(
		async (rawValue: string) => {
			const digits = rawValue.replace(/\D/g, "");
			if (digits.length !== 8) return;

			try {
				const resolved = await lookupCep(digits);

				if (resolved.street)
					setValue("street", resolved.street, { shouldValidate: true });
				if (resolved.district)
					setValue("district", resolved.district, { shouldValidate: true });
				setValue("city", resolved.city, { shouldValidate: true });
				setValue("region", resolved.stateCode, { shouldValidate: true });

				if (resolved.latitude)
					setValue("latitude", resolved.latitude, { shouldValidate: true });
				if (resolved.longitude)
					setValue("longitude", resolved.longitude, { shouldValidate: true });
			} catch {
				// silently fail — user fills manually
			}
		},
		[setValue, lookupCep],
	);

	const { pickValidatedMedia, isPicking } = usePickValidatedMedia();

	const handlePickGallery = async () => {
		try {
			const validAssets = await pickValidatedMedia(
				attachments.map(a => a.uri).filter((uri): uri is string => !!uri),
				{
					requestPermission: true,
					mediaTypes: ["images", "videos"],
					allowsMultipleSelection: true,
					quality: 0.85,
				},
			);
			for (const asset of validAssets) {
				addAttachment({
					id: asset.assetId ?? Crypto.randomUUID(),
					source: "gallery",
					mediaType: asset.type === "video" ? "video" : "photo",
					uri: asset.uri,
					fileSize: asset.fileSize,
					mimeType: asset.mimeType,
				});
			}
		} catch {
			toast.error(
				"Erro ao acessar arquivo",
				"O vídeo pode estar armazenado no iCloud. Baixe-o para o dispositivo e tente novamente.",
			);
		}
	};

	const onSubmit = handleSubmit(async data => {
		if (attachments.length === 0) {
			toast.warning(
				"Adicione pelo menos uma mídia",
				"Tire uma foto ou selecione da galeria.",
			);
			return;
		}

		if (selectedCategoryIds.length === 0) {
			toast.warning(
				"Selecione pelo menos uma categoria",
				"Identifique os tipos de resíduos presentes no local.",
			);
			return;
		}

		const coordsFallback = editingComplaint?.geospatial.location.coords;

		const geospatial: Geospatial = {
			heading: heading
				? {
						trueHeading: heading.trueHeading,
						magHeading: heading.magHeading,
						accuracy: heading.accuracy,
					}
				: (editingComplaint?.geospatial.heading ?? null),
			location: {
				coords: {
					latitude: parseFloat(data.latitude),
					longitude: parseFloat(data.longitude),
					altitude:
						location?.coords.altitude ?? coordsFallback?.altitude ?? null,
					accuracy:
						location?.coords.accuracy ?? coordsFallback?.accuracy ?? null,
					altitudeAccuracy:
						location?.coords.altitudeAccuracy ??
						coordsFallback?.altitudeAccuracy ??
						null,
					heading: location?.coords.heading ?? coordsFallback?.heading ?? null,
					speed: location?.coords.speed ?? coordsFallback?.speed ?? null,
				},
				timestamp:
					location?.timestamp ??
					editingComplaint?.geospatial.location.timestamp ??
					Date.now(),
			},
			addresses: {
				city: data.city,
				district: data.district,
				streetNumber: data.streetNumber,
				street: data.street,
				region: data.region,
				subregion: addresses[0]?.subregion ?? null,
				country: addresses[0]?.country ?? null,
				postalCode: data.postalCode,
				name: addresses[0]?.name ?? null,
				isoCountryCode: addresses[0]?.isoCountryCode ?? null,
				timezone: addresses[0]?.timezone ?? null,
				formattedAddress: addresses[0]?.formattedAddress ?? null,
			},
		};

		const localAttachments = attachments.filter(
			a => a.source !== "api" && !!a.uri,
		);
		const compressedMedia: MediaItem[] = [];

		try {
			if (localAttachments.length > 0) {
				setUploadProgress({
					phase: "compressing",
					current: 0,
					total: localAttachments.length,
				});

				for (let i = 0; i < localAttachments.length; i++) {
					const att = localAttachments[i];
					setUploadProgress({
						phase: "compressing",
						current: i + 1,
						total: localAttachments.length,
					});
					const compressedUri = await compressMedia(
						att.uri as string,
						att.mediaType,
					);
					const size = getFileSize(compressedUri);
					if (size != null && size > MAX_FILE_SIZE_BYTES) {
						toast.error(
							"Arquivo muito grande",
							`Um arquivo excede ${formatFileSize(MAX_FILE_SIZE_BYTES)} após compressão. Reduza a qualidade ou duração.`,
						);
						return;
					}
					compressedMedia.push({
						id: att.id,
						uri: compressedUri,
						mediaType: att.mediaType,
					});
				}
			}

			if (editingComplaint) {
				await editComplaint({
					id: editingComplaint.id,
					geospatial,
					observations: data.observations?.trim() || null,
					newMedia: compressedMedia,
					waste_category_ids: selectedCategoryIds,
					onProgress:
						localAttachments.length > 0 ? setUploadProgress : undefined,
				});

				router.replace("/(tabs)/complaints/list");
				return;
			}

			await submitComplaint({
				geospatial,
				observations: data.observations?.trim() || null,
				media: compressedMedia,
				waste_category_ids: selectedCategoryIds,
				onProgress: setUploadProgress,
			});

			clearDraft();
			setSelectedCategoryIds([]);
			reset();
			router.replace("/(tabs)/complaints/list");
		} finally {
			setUploadProgress(null);
		}
	});

	const isEditMode = !!editingComplaint;

	const hasNewAttachments = attachments.some(a => a.source !== "api");
	const hasRemovedAttachments =
		isEditMode &&
		attachments.filter(a => a.source === "api").length <
			(editingComplaint?.attachments.length ?? 0);
	const hasCategoryChanges =
		isEditMode &&
		(() => {
			const original = editingComplaint?.categories.map(c => c.id) ?? [];
			if (original.length !== selectedCategoryIds.length) return true;
			const sorted = [...original].sort();
			const current = [...selectedCategoryIds].sort();
			return sorted.some((id, i) => id !== current[i]);
		})();
	const hasChanges =
		isDirty || hasNewAttachments || hasRemovedAttachments || hasCategoryChanges;
	const isSubmitDisabled = isPending || (isEditMode && !hasChanges);

	return (
		<KeyboardAvoidingView behavior="padding" className="flex-1 bg-white">
			<ScrollView
				className="flex-1"
				contentContainerStyle={{
					paddingTop: insets.top + 16,
					gap: 16,
					paddingHorizontal: 16,
					paddingBottom: 32,
				}}
				keyboardShouldPersistTaps="handled"
			>
				{/* Info card */}
				<Card className="flex-row items-start gap-3 bg-gray-100 p-3 shadow-none">
					<View className="size-10 items-center justify-center rounded-lg bg-lime-800">
						<ShieldAlertIcon size={18} color={colors.white} strokeWidth={2.2} />
					</View>
					<Text className="flex-1 text-sm text-gray-600">
						{isEditMode
							? "Edite os dados da denúncia. Você pode atualizar a localização, observações e adicionar novas mídias."
							: "Registre denúncias de descarte irregular informando o local e anexando fotos ou vídeos como evidência."}
					</Text>
				</Card>

				{/* Localização */}
				<SectionHeader
					title="Localização do ocorrido"
					description={
						isEditMode
							? "Ajuste pelo mapa, busca de endereço ou CEP se necessário."
							: "Preenchido automaticamente pela sua localização. Ajuste pelo mapa, busca de endereço ou CEP se necessário."
					}
				/>

				<GooglePlacesInput onSelect={handleAddressSelect} />

				{shouldMountMap ? (
					<WrapperMap
						latitude={latValue ? parseFloat(latValue) : null}
						longitude={lonValue ? parseFloat(lonValue) : null}
						onChange={handleMapChange}
					/>
				) : (
					<View className="h-96 overflow-hidden rounded-lg border border-border">
						<MapSkeleton />
					</View>
				)}
				{isReverseGeocoding && (
					<View className="flex-row items-center gap-2">
						<Spinner size="small" />
						<Text className="text-xs text-muted-foreground">
							Buscando endereço...
						</Text>
					</View>
				)}
				{(errors.latitude?.message ?? errors.longitude?.message) && (
					<FormControlError>
						<FormControlErrorIcon as={AlertCircleIcon} />
						<FormControlErrorText>
							{errors.latitude?.message ?? errors.longitude?.message}
						</FormControlErrorText>
					</FormControlError>
				)}

				<Divider />

				<VStack>
					<Heading size="sm">Endereço</Heading>
					<Text size="sm" className="text-muted-foreground">
						Os dados puxados de forma automáticas, podem ser incoerentes. Caso
						haja necessidade, faça a modificação manualmente.
					</Text>
				</VStack>
				<AddressFormFields
					control={control}
					errors={errors}
					handleCepLookup={handleCepLookup}
					isLookingUpCep={isLookingUpCep}
				/>

				{/* Mídias */}
				<View className="gap-2 pt-1">
					<SectionHeader
						title="Fotos e vídeos"
						description={
							isEditMode
								? "Adicione novas mídias ou remova as existentes."
								: "Capture pela câmera ou selecione da galeria. Ao menos uma mídia é obrigatória."
						}
						className="gap-0 pt-0"
					/>

					<View className="flex-row gap-2">
						<Button
							variant="outline"
							className="flex-1"
							onPress={() => router.push("/(tabs)/complaints/(create)/camera")}
							isDisabled={isPending}
						>
							<ButtonIcon as={CameraIcon} />
							<ButtonText>Câmera</ButtonText>
						</Button>
						<Button
							variant="outline"
							className="flex-1"
							onPress={handlePickGallery}
							isDisabled={isPending || isPicking}
						>
							<ButtonIcon as={isPicking ? Spinner : ImageIcon} />
							<ButtonText>Galeria</ButtonText>
						</Button>
					</View>

					{attachments.length > 0 && (
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerClassName="gap-2 py-2"
							nestedScrollEnabled
							keyboardShouldPersistTaps="always"
						>
							{attachments.map(attachment => {
								const uri = attachment.uri ?? attachment.url;
								if (!uri) return null;
								return (
									<AttachmentThumbnail
										key={attachment.id}
										uri={uri}
										mediaType={attachment.mediaType}
										fileSizeBytes={attachment.fileSize}
										onRemove={() => handleRemove(attachment)}
										onPress={() =>
											router.push({
												pathname: "/(tabs)/complaints/(create)/preview",
												params: { id: attachment.id },
											})
										}
									/>
								);
							})}
						</ScrollView>
					)}
				</View>

				<FormControl isInvalid={!!errors.observations} className="gap-1">
					<FormControlLabel>
						<FormControlLabelText>
							<Heading size="sm"> Observações</Heading>
						</FormControlLabelText>
					</FormControlLabel>
					<Controller
						control={control}
						name="observations"
						render={({ field: { value, onChange } }) => (
							<Input className="min-h-20">
								<InputField
									multiline
									textAlignVertical="top"
									numberOfLines={3}
									maxLength={500}
									placeholder="Descreva o ocorrido com detalhes relevantes..."
									value={value}
									onChangeText={onChange}
								/>
							</Input>
						)}
					/>
					{errors.observations?.message && (
						<FormControlError>
							<FormControlErrorIcon as={AlertCircleIcon} />
							<FormControlErrorText>
								{errors.observations.message}
							</FormControlErrorText>
						</FormControlError>
					)}
				</FormControl>

				{/* Categorias */}
				<WasteCategorySelector
					defaultCategoryIds={editingComplaint?.categories.map(c => c.id)}
					onSelectionChange={setSelectedCategoryIds}
				/>

				{/* Ações */}
				<View className="flex-row gap-3 pt-2">
					<Button
						variant="outline"
						className="flex-1"
						onPress={() => router.back()}
						isDisabled={isPending}
					>
						<ButtonText>
							{isEditMode ? "Cancelar edição" : "Cancelar"}
						</ButtonText>
					</Button>
					<Button
						className="flex-1 bg-lime-800"
						onPress={onSubmit}
						isDisabled={isSubmitDisabled}
					>
						<ButtonText className="text-white">
							{isEditMode ? "Salvar alterações" : "Enviar denúncia"}
						</ButtonText>
						{isPending && <ButtonSpinner />}
					</Button>
				</View>
			</ScrollView>

			<AttachmentDeleteConfirmModal
				pendingDelete={pendingDelete}
				cancelDelete={cancelDelete}
				confirmDelete={confirmDelete}
				isDeleting={isDeleting}
			/>

			<MediaUploadProgress progress={uploadProgress} />
		</KeyboardAvoidingView>
	);
}
