import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Camera, ShieldAlertIcon, X } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
	KeyboardAvoidingView,
	ScrollView,
	TouchableOpacity,
	View,
} from "react-native";
import { z } from "zod";
import {
	type GooglePlacesAddressFields,
	GooglePlacesInput,
} from "@/components/google-places-input";
import { MediaThumbnail } from "@/components/medias-preview/media-thumbnail";
import { colors } from "@/components/style/colors";
import { toast } from "@/components/toast";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	FormControl,
	FormControlError,
	FormControlErrorText,
	FormControlLabel,
	FormControlLabelText,
} from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { Input, InputField, InputSlot } from "@/components/ui/input";
import { Pressable } from "@/components/ui/pressable";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import WrapperMap from "@/components/wrapper-map";
import {
	COMPLAINTS_QUERY_KEY,
	DASHBOARD_QUERY_KEY,
} from "@/contexts/complaints-context";
import { getCepV2 } from "@/libs/brasil-api-sdk";
import { mask } from "@/libs/mask";
import {
	postV1ComplaintsByIdCapturesByCaptureIdAttachments,
	postV1ComplaintsManual,
} from "@/libs/oikos-sdk";
import {
	type ComplaintType,
	complaintTypeValues,
} from "@/libs/types/complaint";

function maskDate(v: string) {
	const d = v.replace(/\D/g, "").slice(0, 8);
	return d.replace(/(\d{2})(\d)/, "$1/$2").replace(/(\d{2})(\d)/, "$1/$2");
}

function maskTime(v: string) {
	const d = v.replace(/\D/g, "").slice(0, 4);
	return d.replace(/(\d{2})(\d)/, "$1:$2");
}

const manualSchema = z.object({
	type: z.enum([
		"IRREGULAR_DISPOSAL",
		"DEFORESTATION",
		"BURNING",
		"VACANT_LOT",
	]),
	date: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, "Use o formato DD/MM/AAAA."),
	time: z.string().regex(/^\d{2}:\d{2}$/, "Use o formato HH:MM."),
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

type ManualFormValues = z.infer<typeof manualSchema>;

export default function ManualComplaintScreen() {
	const queryClient = useQueryClient();
	const now = new Date();

	const {
		control,
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
	} = useForm<ManualFormValues>({
		resolver: zodResolver(manualSchema),
		defaultValues: {
			type: "IRREGULAR_DISPOSAL",
			date: format(now, "dd/MM/yyyy"),
			time: format(now, "HH:mm"),
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

	const [selectedAssets, setSelectedAssets] = useState<
		ImagePicker.ImagePickerAsset[]
	>([]);
	const [isLookingUpCep, setIsLookingUpCep] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const selectedType = watch("type");
	const latValue = watch("latitude");
	const lonValue = watch("longitude");

	const handleAddressSelect = useCallback(
		(fields: GooglePlacesAddressFields) => {
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

	const handlePickMedia = async () => {
		const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (!perm.granted) {
			toast.error(
				"Permissão negada",
				"Permita o acesso à galeria nas configurações.",
			);
			return;
		}

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images", "videos"],
			allowsMultipleSelection: true,
			quality: 0.85,
			orderedSelection: true,
		});

		if (!result.canceled) {
			setSelectedAssets(prev => {
				const existingUris = new Set(prev.map(a => a.uri));
				const toAdd = result.assets.filter(a => !existingUris.has(a.uri));
				return [...prev, ...toAdd];
			});
		}
	};

	const handleRemoveAsset = (uri: string) => {
		setSelectedAssets(prev => prev.filter(a => a.uri !== uri));
	};

	const onSubmit = handleSubmit(async data => {
		setIsSubmitting(true);
		try {
			const [day, month, year] = data.date.split("/");
			const [hour, minute] = data.time.split(":");
			const eventDate = new Date(
				`${year}-${month}-${day}T${hour}:${minute}:00`,
			);

			const res = await postV1ComplaintsManual({
				body: {
					date: eventDate.toISOString(),
					type: data.type,
					observations: data.observations?.trim() || null,
					geospatial: {
						heading: null,
						location: {
							coords: {
								latitude: parseFloat(data.latitude),
								longitude: parseFloat(data.longitude),
								altitude: null,
								accuracy: null,
								altitudeAccuracy: null,
								heading: null,
								speed: null,
							},
							timestamp: eventDate.getTime(),
						},
						addresses: {
							street: data.street,
							streetNumber: data.streetNumber,
							district: data.district,
							city: data.city,
							region: data.region,
							postalCode: data.postalCode,
							subregion: null,
							country: "Brasil",
							name: null,
							isoCountryCode: "BR",
							timezone: null,
						},
					},
				},
			});

			const complaintId = res.data?.complaint.id;
			const captureId = res.data?.complaint.captures[0]?.id;

			if (complaintId && captureId && selectedAssets.length > 0) {
				for (const asset of selectedAssets) {
					const isPhoto = asset.type === "image";
					const ext = isPhoto ? "jpg" : "mp4";
					const formData = new FormData();
					formData.append("file", {
						uri: asset.uri,
						name:
							asset.fileName ?? `manual_${complaintId}_${Date.now()}.${ext}`,
						type: isPhoto ? "image/jpeg" : "video/mp4",
					} as unknown as Blob);
					await postV1ComplaintsByIdCapturesByCaptureIdAttachments({
						path: { id: complaintId, captureId },
						body: formData as unknown as undefined,
					});
				}
			}

			await queryClient.invalidateQueries({ queryKey: COMPLAINTS_QUERY_KEY });
			await queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });

			toast.success(
				"Denúncia registrada",
				"Sua denúncia manual foi enviada com sucesso.",
			);
			router.replace("/(tabs)/complaints");
		} catch {
			toast.error(
				"Erro ao enviar",
				"Não foi possível registrar a denúncia. Tente novamente.",
			);
		} finally {
			setIsSubmitting(false);
		}
	});

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
						Use este formulário para registrar denúncias de eventos que já
						ocorreram, informando o endereço e anexando fotos ou vídeos da sua
						galeria.
					</Text>
				</Card>

				{/* Tipo */}
				<FormControl isInvalid={!!errors.type} className="gap-2">
					<FormControlLabel>
						<FormControlLabelText>Tipo da denúncia *</FormControlLabelText>
					</FormControlLabel>
					<Controller
						control={control}
						name="type"
						render={({ field: { value, onChange } }) => (
							<View className="flex-row flex-wrap gap-2">
								{complaintTypeValues.map(opt => {
									const isSelected = value === opt.value;
									return (
										<Pressable
											key={opt.value}
											className={`rounded-md border px-3 py-2 ${isSelected ? "border-lime-800 bg-lime-800" : "border-gray-200 bg-white"}`}
											onPress={() => onChange(opt.value as ComplaintType)}
										>
											<Text
												className={isSelected ? "text-white" : "text-gray-700"}
											>
												{opt.label}
											</Text>
										</Pressable>
									);
								})}
							</View>
						)}
					/>
					<Card className="shadow-none bg-lime-50 border-lime-800 p-2">
						<Text className="text-sm text-lime-900">
							{
								complaintTypeValues.find(o => o.value === selectedType)
									?.description
							}
						</Text>
					</Card>
					{errors.type?.message && (
						<FormControlError>
							<FormControlErrorText>{errors.type.message}</FormControlErrorText>
						</FormControlError>
					)}
				</FormControl>

				{/* Data e hora */}
				<View className="flex-row gap-3">
					<FormControl isInvalid={!!errors.date} className="flex-1 gap-1">
						<FormControlLabel>
							<FormControlLabelText>Data do ocorrido *</FormControlLabelText>
						</FormControlLabel>
						<Controller
							control={control}
							name="date"
							render={({ field: { value, onChange } }) => (
								<Input>
									<InputField
										placeholder="DD/MM/AAAA"
										keyboardType="numeric"
										value={value}
										onChangeText={v => onChange(maskDate(v))}
										maxLength={10}
									/>
								</Input>
							)}
						/>
						{errors.date?.message && (
							<FormControlError>
								<FormControlErrorText>
									{errors.date.message}
								</FormControlErrorText>
							</FormControlError>
						)}
					</FormControl>

					<FormControl isInvalid={!!errors.time} className="w-28 gap-1">
						<FormControlLabel>
							<FormControlLabelText>Hora *</FormControlLabelText>
						</FormControlLabel>
						<Controller
							control={control}
							name="time"
							render={({ field: { value, onChange } }) => (
								<Input>
									<InputField
										placeholder="HH:MM"
										keyboardType="numeric"
										value={value}
										onChangeText={v => onChange(maskTime(v))}
										maxLength={5}
									/>
								</Input>
							)}
						/>
						{errors.time?.message && (
							<FormControlError>
								<FormControlErrorText>
									{errors.time.message}
								</FormControlErrorText>
							</FormControlError>
						)}
					</FormControl>
				</View>

				{/* Observações */}
				<FormControl isInvalid={!!errors.observations} className="gap-1">
					<FormControlLabel>
						<FormControlLabelText>Observações</FormControlLabelText>
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
							<FormControlErrorText>
								{errors.observations.message}
							</FormControlErrorText>
						</FormControlError>
					)}
				</FormControl>

				{/* Seção de endereço */}
				<View className="gap-1 pt-1">
					<Heading size="md">Localização do ocorrido</Heading>
					<Text className="text-sm text-gray-500">
						Busque pelo endereço ou preencha os campos manualmente.
					</Text>
				</View>

				<GooglePlacesInput onSelect={handleAddressSelect} />

				{/* CEP */}
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
							<FormControlErrorText>{errors.city.message}</FormControlErrorText>
						</FormControlError>
					)}
				</FormControl>

				{/* Mapa */}
				<WrapperMap
					latitude={latValue ? parseFloat(latValue) : null}
					longitude={lonValue ? parseFloat(lonValue) : null}
					onChange={loc => {
						setValue("latitude", String(loc.latitude), {
							shouldValidate: true,
						});
						setValue("longitude", String(loc.longitude), {
							shouldValidate: true,
						});
					}}
				/>
				{(errors.latitude?.message ?? errors.longitude?.message) && (
					<FormControlError>
						<FormControlErrorText>
							{errors.latitude?.message ?? errors.longitude?.message}
						</FormControlErrorText>
					</FormControlError>
				)}

				{/* Mídias */}
				<View className="gap-2 pt-1">
					<Heading size="md">Fotos e vídeos</Heading>
					<Text className="text-sm text-gray-500">
						Selecione as imagens ou vídeos da galeria que registram o ocorrido.
					</Text>

					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerClassName="gap-2 py-2"
						nestedScrollEnabled
						keyboardShouldPersistTaps="always"
					>
						<Pressable
							onPress={handlePickMedia}
							className="items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50"
							style={{ width: 80, height: 80 }}
						>
							<Camera size={24} color={colors.gray[400]} />
						</Pressable>

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
				</View>

				{/* Actions */}
				<View className="flex-row gap-3 pt-2">
					<Button
						variant="outline"
						className="flex-1"
						onPress={() => router.back()}
						disabled={isSubmitting}
					>
						<ButtonText>Cancelar</ButtonText>
					</Button>
					<Button
						className="flex-1 bg-lime-800"
						onPress={onSubmit}
						disabled={isSubmitting}
					>
						<ButtonText className="text-white">
							{isSubmitting ? "Enviando…" : "Enviar denúncia"}
						</ButtonText>
						{isSubmitting && <ButtonSpinner />}
					</Button>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}
