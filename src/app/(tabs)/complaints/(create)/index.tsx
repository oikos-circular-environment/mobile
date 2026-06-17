import { zodResolver } from "@hookform/resolvers/zod";
import * as Crypto from "expo-crypto";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import {
	AlertCircleIcon,
	Camera,
	ImageIcon,
	ShieldAlertIcon,
	X,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
	KeyboardAvoidingView,
	ScrollView,
	TouchableOpacity,
	View,
} from "react-native";
import { z } from "zod";
import { useAttachmentRemove } from "@/components/complaints/hooks/use-attachment-remove";
import { useEditComplaint } from "@/components/complaints/hooks/use-edit-complaint";
import type { MediaItem } from "@/components/complaints/hooks/use-submit-complaints";
import { useSubmitComplaints } from "@/components/complaints/hooks/use-submit-complaints";
import {
	type HazardLevelVariant,
	WasteCategory,
	WasteCategoryChip,
	WasteCategoryChips,
	WasteCategoryChipText,
	WasteCategoryContent,
	WasteCategoryHazardLevel,
	WasteCategoryHazardLevelIcon,
} from "@/components/custom/waste-category";
import { GooglePlacesInput } from "@/components/google-places-input";
import { MediaThumbnail } from "@/components/medias-preview/media-thumbnail";
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
import { Input, InputField, InputSlot } from "@/components/ui/input";
import {
	Modal,
	ModalBackdrop,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
} from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import WrapperMap from "@/components/wrapper-map";
import { useComplaintCreation } from "@/contexts/complaint-creation-context";
import { useGeospatial } from "@/contexts/geospatial-context";
import { getCepV2 } from "@/libs/brasil-api-sdk";
import {
	type GoogleAddressFields,
	reverseGeocode,
} from "@/libs/google/reverse-geocode";
import { mask } from "@/libs/mask";
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
	const { location, heading, addresses } = useGeospatial();
	const {
		attachments,
		editingComplaint,
		addAttachment,
		clearDraft,
		exitEditMode,
	} = useComplaintCreation();
	const hasAutoFilled = useRef(false);

	const [isLookingUpCep, setIsLookingUpCep] = useState(false);
	const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
	const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

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

	// ─── Address helpers ──────────────────────────────────────────────────────

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

			setIsLookingUpCep(true);
			try {
				const res = await getCepV2({ path: { cep: digits } });
				const data = res.data;
				if (!data) return;

				if (data.street)
					setValue("street", data.street, { shouldValidate: true });
				if (data.neighborhood)
					setValue("district", data.neighborhood, { shouldValidate: true });
				setValue("city", data.city, { shouldValidate: true });
				setValue("region", data.state, { shouldValidate: true });

				const lat = data.location?.coordinates?.latitude;
				const lon = data.location?.coordinates?.longitude;
				if (lat) setValue("latitude", lat, { shouldValidate: true });
				if (lon) setValue("longitude", lon, { shouldValidate: true });
			} catch {
				// silently fail — user fills manually
			} finally {
				setIsLookingUpCep(false);
			}
		},
		[setValue],
	);

	// ─── Gallery ─────────────────────────────────────────────────────────────

	const handlePickGallery = async () => {
		const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (!perm.granted) {
			toast.error(
				"Permissão negada",
				"Permita o acesso à galeria nas configurações.",
			);
			return;
		}
		try {
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ["images", "videos"],
				allowsMultipleSelection: true,
				quality: 0.85,
			});
			if (!result.canceled) {
				const existingUris = new Set(
					attachments.map(a => a.uri).filter(Boolean),
				);
				for (const asset of result.assets) {
					if (existingUris.has(asset.uri)) continue;
					addAttachment({
						id: asset.assetId ?? Crypto.randomUUID(),
						source: "gallery",
						mediaType: asset.type === "video" ? "video" : "photo",
						uri: asset.uri,
					});
				}
			}
		} catch {
			toast.error(
				"Erro ao acessar arquivo",
				"O vídeo pode estar armazenado no iCloud. Baixe-o para o dispositivo e tente novamente.",
			);
		}
	};

	// ─── Submit ───────────────────────────────────────────────────────────────

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

		if (editingComplaint) {
			const newMedia = attachments
				.filter(a => a.source !== "api" && !!a.uri)
				.map(a => ({ id: a.id, uri: a.uri as string, mediaType: a.mediaType }));

			await editComplaint({
				id: editingComplaint.id,
				geospatial,
				observations: data.observations?.trim() || null,
				newMedia,
				waste_category_ids: selectedCategoryIds,
			});

			router.replace("/(tabs)/complaints/list");
			return;
		}

		const localMedia: MediaItem[] = attachments
			.filter(a => !!a.uri)
			.map(a => ({ id: a.id, uri: a.uri as string, mediaType: a.mediaType }));

		await submitComplaint({
			geospatial,
			observations: data.observations?.trim() || null,
			media: localMedia,
			waste_category_ids: selectedCategoryIds,
		});

		clearDraft();
		setSelectedCategoryIds([]);
		reset();
		router.replace("/(tabs)/complaints/list");
	});

	// ─── Render ───────────────────────────────────────────────────────────────

	const isEditMode = !!editingComplaint;

	const hasNewAttachments = attachments.some(a => a.source !== "api");
	const hasRemovedAttachments =
		isEditMode &&
		attachments.filter(a => a.source === "api").length <
			(editingComplaint?.attachments.length ?? 0);
	const hasChanges = isDirty || hasNewAttachments || hasRemovedAttachments;
	const isSubmitDisabled = isPending || (isEditMode && !hasChanges);

	return (
		<KeyboardAvoidingView behavior="padding" className="flex-1 bg-white">
			<ScrollView
				className="flex-1"
				contentContainerClassName="gap-4 px-4 py-4 pb-8"
				keyboardShouldPersistTaps="always"
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
				<View className="gap-1 pt-1">
					<Heading size="sm">Localização do ocorrido</Heading>
					<Text className="text-sm text-gray-500">
						{isEditMode
							? "Ajuste pelo mapa, busca de endereço ou CEP se necessário."
							: "Preenchido automaticamente pela sua localização. Ajuste pelo mapa, busca de endereço ou CEP se necessário."}
					</Text>
				</View>

				<GooglePlacesInput onSelect={handleAddressSelect} />

				<WrapperMap
					latitude={latValue ? parseFloat(latValue) : null}
					longitude={lonValue ? parseFloat(lonValue) : null}
					onChange={handleMapChange}
				/>
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
				<FormControl isInvalid={!!errors.postalCode} className="gap-1">
					<FormControlLabel>
						<FormControlLabelText>CEP *</FormControlLabelText>
					</FormControlLabel>
					<Controller
						control={control}
						name="postalCode"
						render={({ field: { value, onChange, onBlur } }) => (
							<Input>
								<InputField
									placeholder="00000-000"
									keyboardType="numeric"
									value={value}
									onChangeText={v => onChange(mask.cep(v))}
									onBlur={() => {
										onBlur();
										void handleCepLookup(value);
									}}
									maxLength={9}
								/>
								{isLookingUpCep && (
									<InputSlot className="pr-3">
										<Spinner size="small" />
									</InputSlot>
								)}
							</Input>
						)}
					/>
					{errors.postalCode?.message && (
						<FormControlError>
							<FormControlErrorIcon as={AlertCircleIcon} />
							<FormControlErrorText>
								{errors.postalCode.message}
							</FormControlErrorText>
						</FormControlError>
					)}
				</FormControl>

				{/* Rua + Número */}
				<View className="flex-row gap-3">
					<FormControl isInvalid={!!errors.street} className="flex-1 gap-1">
						<FormControlLabel>
							<FormControlLabelText>Rua *</FormControlLabelText>
						</FormControlLabel>
						<Controller
							control={control}
							name="street"
							render={({ field: { value, onChange } }) => (
								<Input>
									<InputField
										placeholder="Nome da rua"
										value={value}
										onChangeText={onChange}
									/>
								</Input>
							)}
						/>
						{errors.street?.message && (
							<FormControlError>
								<FormControlErrorIcon as={AlertCircleIcon} />
								<FormControlErrorText>
									{errors.street.message}
								</FormControlErrorText>
							</FormControlError>
						)}
					</FormControl>

					<FormControl isInvalid={!!errors.streetNumber} className="w-24 gap-1">
						<FormControlLabel>
							<FormControlLabelText>Nº *</FormControlLabelText>
						</FormControlLabel>
						<Controller
							control={control}
							name="streetNumber"
							render={({ field: { value, onChange } }) => (
								<Input>
									<InputField
										placeholder="123"
										keyboardType="numeric"
										value={value}
										onChangeText={onChange}
									/>
								</Input>
							)}
						/>
						{errors.streetNumber?.message && (
							<FormControlError>
								<FormControlErrorIcon as={AlertCircleIcon} />
								<FormControlErrorText>
									{errors.streetNumber.message}
								</FormControlErrorText>
							</FormControlError>
						)}
					</FormControl>
				</View>

				{/* Bairro + UF */}
				<View className="flex-row gap-3">
					<FormControl isInvalid={!!errors.district} className="flex-1 gap-1">
						<FormControlLabel>
							<FormControlLabelText>Bairro *</FormControlLabelText>
						</FormControlLabel>
						<Controller
							control={control}
							name="district"
							render={({ field: { value, onChange } }) => (
								<Input>
									<InputField
										placeholder="Bairro"
										value={value}
										onChangeText={onChange}
									/>
								</Input>
							)}
						/>
						{errors.district?.message && (
							<FormControlError>
								<FormControlErrorIcon as={AlertCircleIcon} />
								<FormControlErrorText>
									{errors.district.message}
								</FormControlErrorText>
							</FormControlError>
						)}
					</FormControl>

					<FormControl isInvalid={!!errors.region} className="w-24 gap-1">
						<FormControlLabel>
							<FormControlLabelText>UF *</FormControlLabelText>
						</FormControlLabel>
						<Controller
							control={control}
							name="region"
							render={({ field: { value, onChange } }) => (
								<Input>
									<InputField
										placeholder="SP"
										value={value}
										onChangeText={v =>
											onChange(
												v
													.toUpperCase()
													.replace(/[^A-Z]/g, "")
													.slice(0, 2),
											)
										}
										maxLength={2}
										autoCapitalize="characters"
									/>
								</Input>
							)}
						/>
						{errors.region?.message && (
							<FormControlError>
								<FormControlErrorIcon as={AlertCircleIcon} />
								<FormControlErrorText>
									{errors.region.message}
								</FormControlErrorText>
							</FormControlError>
						)}
					</FormControl>
				</View>

				{/* Cidade */}
				<FormControl isInvalid={!!errors.city} className="gap-1">
					<FormControlLabel>
						<FormControlLabelText>Cidade *</FormControlLabelText>
					</FormControlLabel>
					<Controller
						control={control}
						name="city"
						render={({ field: { value, onChange } }) => (
							<Input>
								<InputField
									placeholder="Cidade"
									value={value}
									onChangeText={onChange}
								/>
							</Input>
						)}
					/>
					{errors.city?.message && (
						<FormControlError>
							<FormControlErrorIcon as={AlertCircleIcon} />
							<FormControlErrorText>{errors.city.message}</FormControlErrorText>
						</FormControlError>
					)}
				</FormControl>

				{/* Mídias */}
				<View className="gap-2 pt-1">
					<Heading size="sm">Fotos e vídeos</Heading>
					<Text className="text-sm text-gray-500">
						{isEditMode
							? "Adicione novas mídias ou remova as existentes."
							: "Capture pela câmera ou selecione da galeria. Ao menos uma mídia é obrigatória."}
					</Text>

					<View className="flex-row gap-2">
						<Button
							variant="outline"
							className="flex-1"
							onPress={() => router.push("/(tabs)/complaints/(create)/camera")}
							isDisabled={isPending}
						>
							<ButtonIcon as={Camera} />
							<ButtonText>Câmera</ButtonText>
						</Button>
						<Button
							variant="outline"
							className="flex-1"
							onPress={handlePickGallery}
							isDisabled={isPending}
						>
							<ButtonIcon as={ImageIcon} />
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
									<View
										key={attachment.id}
										className="relative"
										style={{ width: 80, height: 80 }}
									>
										<TouchableOpacity
											activeOpacity={0.85}
											onPress={() =>
												router.push({
													pathname: "/(tabs)/complaints/(create)/preview",
													params: { id: attachment.id },
												})
											}
											className="flex-1 overflow-hidden rounded-xl"
										>
											<MediaThumbnail
												mediaType={attachment.mediaType}
												uri={uri}
												fallbackLabel={
													attachment.mediaType === "video" ? "VÍD" : "IMG"
												}
											/>
										</TouchableOpacity>
										<TouchableOpacity
											className="absolute -right-1 -top-1 items-center justify-center rounded-full bg-red-500 p-0.5"
											onPress={() => handleRemove(attachment)}
										>
											<X size={12} color={colors.white} strokeWidth={2.5} />
										</TouchableOpacity>
									</View>
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
				<View className="gap-2 pt-1">
					<Heading size="sm">Categorias identificadas</Heading>
					<Text className="text-sm text-gray-500">
						Selecione os tipos de resíduos que você consegue identificar no
						local.
					</Text>
					<WasteCategory
						selectionMode="multiple"
						defaultCategoryIds={editingComplaint?.categories.map(c => c.id)}
						onSelectionChange={cats =>
							setSelectedCategoryIds(cats.map(c => c.id))
						}
					>
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerClassName="gap-2 py-0.5"
						>
							<WasteCategoryChips>
								{category => (
									<WasteCategoryChip key={category.id} category={category}>
										<WasteCategoryChipText>
											{category.name}
										</WasteCategoryChipText>
										{category.hazard_levels.map(hazard => (
											<WasteCategoryHazardLevel
												key={hazard}
												variant={hazard.toLowerCase() as HazardLevelVariant}
											>
												<WasteCategoryHazardLevelIcon />
											</WasteCategoryHazardLevel>
										))}
									</WasteCategoryChip>
								)}
							</WasteCategoryChips>
						</ScrollView>
						<WasteCategoryContent />
					</WasteCategory>
				</View>

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

			{/* Modal de confirmação de deleção de anexo */}
			<Modal isOpen={!!pendingDelete} onClose={cancelDelete} size="sm">
				<ModalBackdrop />
				<ModalContent>
					<ModalHeader>
						<Heading size="md">Remover anexo</Heading>
					</ModalHeader>
					<ModalBody>
						<Text className="text-sm text-gray-600">
							Tem certeza que deseja remover este anexo? Esta ação não pode ser
							desfeita.
						</Text>
					</ModalBody>
					<ModalFooter className="gap-2">
						<Button
							variant="outline"
							className="flex-1"
							onPress={cancelDelete}
							isDisabled={isDeleting}
						>
							<ButtonText>Cancelar</ButtonText>
						</Button>
						<Button
							className="flex-1 bg-red-600"
							onPress={confirmDelete}
							isDisabled={isDeleting}
						>
							<ButtonText className="text-white">Remover</ButtonText>
							{isDeleting && <ButtonSpinner />}
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</KeyboardAvoidingView>
	);
}
