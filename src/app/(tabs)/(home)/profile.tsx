import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Stack, useRouter } from "expo-router";
import {
	AlertCircleIcon,
	ChevronDown,
	InfoIcon,
	PencilIcon,
	Search,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
	Animated,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	TouchableOpacity,
	View,
} from "react-native";
import { z } from "zod";
import DefaultImage from "@/assets/icons/icon.png";
import { toast } from "@/components/toast";
import { Alert, AlertIcon, AlertText } from "@/components/ui/alert";
import {
	Button,
	ButtonIcon,
	ButtonSpinner,
	ButtonText,
} from "@/components/ui/button";
import {
	FormControl,
	FormControlError,
	FormControlErrorIcon,
	FormControlErrorText,
	FormControlLabel,
	FormControlLabelText,
} from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import {
	Select,
	SelectBackdrop,
	SelectContent,
	SelectDragIndicator,
	SelectDragIndicatorWrapper,
	SelectIcon,
	SelectInput,
	SelectItem,
	SelectPortal,
	SelectTrigger,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { VStack } from "@/components/ui/vstack";
import WrapperMap from "@/components/wrapper-map";
import { useAuthContext } from "@/contexts/auth-context";
import {
	getCepV2,
	listIbgeMunicipios,
	listIbgeUfs,
} from "@/libs/brasil-api-sdk";
import { mask } from "@/libs/mask";
import { compressImage } from "@/libs/media-compression";
import { putV1Profiles, putV1ProfilesAvatar } from "@/libs/oikos-sdk";
import { cn } from "@/libs/utils";

const profileSchema = z.object({
	fullName: z.string().min(3, "Informe seu nome completo."),
	displayName: z.string().min(2, "Informe como prefere ser chamado."),
	profileImage: z.string().optional().nullable(),
	phone: z
		.string()
		.regex(/^\(\d{2}\)\s(\d\s)?\d{4}-\d{4}$/, "Informe um celular valido."),
	address: z.object({
		zip_code: z
			.string()
			.regex(/^[0-9]{8}$|^[0-9]{5}-[0-9]{3}$/, "Informe um CEP valido."),
		street: z.string().min(3, "Informe a rua."),
		number: z.string().min(1, "Informe o numero."),
		complement: z.string().optional().nullable(),
		district: z.string().min(2, "Informe o bairro."),
		city: z.string().min(2, "Informe a cidade."),
		city_ibge_id: z.number(),
		state: z.string().min(2, "Informe o estado."),
		state_code: z.string().length(2, "Use a sigla com 2 letras."),
		state_ibge_id: z.number(),
		latitude: z.number().nullable(),
		longitude: z.number().nullable(),
	}),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileScreen() {
	const { user, updateUserProfile } = useAuthContext();
	const router = useRouter();
	const selectedAsset = useRef<ImagePicker.ImagePickerAsset | null>(null);
	const [selectedCity, setSelectedCity] = useState<string | null>(null);
	const contentOpacity = useRef(new Animated.Value(0)).current;

	const {
		control,
		handleSubmit,
		reset,
		setValue,
		watch,
		formState: { errors, isDirty },
	} = useForm<ProfileFormValues>({
		resolver: zodResolver(profileSchema),
		defaultValues: {
			fullName: user?.profile?.full_name || "",
			displayName: user?.profile?.display_name || "",
			profileImage: user?.profile?.profile_image?.url || null,
			phone: user?.profile?.phone ? mask.phoneBr(user.profile.phone) : "",
			address: {
				zip_code: user?.profile?.address?.zip_code
					? mask.cep(user.profile.address.zip_code)
					: "",
				street: user?.profile?.address?.street || "",
				number: user?.profile?.address?.number || "",
				complement: user?.profile?.address?.complement || "",
				district: user?.profile?.address?.district || "",
				city: user?.profile?.address?.city || "",
				city_ibge_id: user?.profile?.address?.city_ibge_id
					? Number(user.profile.address.city_ibge_id)
					: 0,
				state: user?.profile?.address?.state || "",
				state_code: user?.profile?.address?.state_code || "",
				state_ibge_id: user?.profile?.address?.state_ibge_id
					? Number(user.profile.address.state_ibge_id)
					: 0,
				latitude: user?.profile?.address?.latitude
					? Number(user.profile.address.latitude)
					: null,
				longitude: user?.profile?.address?.longitude
					? Number(user.profile.address.longitude)
					: null,
			},
		},
	});

	const selectedStateCode = watch("address.state_code");

	const { data: states, isPending: isPendingStates } = useQuery({
		queryKey: ["states"],
		queryFn: async () => {
			// const response = await getAllStatesV1BrasilApi();
			const response = await listIbgeUfs();
			return response.data
				? response.data.sort((a, b) => a.nome.localeCompare(b.nome))
				: [];
		},
		staleTime: 1000 * 60 * 60 * 24, // 24 hours
	});

	const { data: cities, isPending: isPendingCities } = useQuery({
		queryKey: ["cities", selectedStateCode],
		queryFn: async () => {
			const response = await listIbgeMunicipios({
				path: {
					siglaUF: selectedStateCode,
				},
			});
			return response.data
				? response.data.sort((a, b) => a.nome.localeCompare(b.nome))
				: [];
		},
		enabled: !!selectedStateCode && selectedStateCode.length === 2,
	});

	useEffect(() => {
		if (user?.profile) {
			reset({
				fullName: user.profile.full_name || "",
				displayName: user.profile.display_name || "",
				profileImage: user.profile.profile_image?.url || null,
				phone: user.profile.phone ? mask.phoneBr(user.profile.phone) : "",
				address: {
					zip_code: user.profile.address?.zip_code
						? mask.cep(user.profile.address.zip_code)
						: "",
					street: user.profile.address?.street || "",
					number: user.profile.address?.number || "",
					complement: user.profile.address?.complement || "",
					district: user.profile.address?.district || "",
					city: user.profile.address?.city || "",
					city_ibge_id: user.profile.address?.city_ibge_id
						? Number(user.profile.address.city_ibge_id)
						: 0,
					state: user.profile.address?.state || "",
					state_code: user.profile.address?.state_code || "",
					state_ibge_id: user.profile.address?.state_ibge_id
						? Number(user.profile.address.state_ibge_id)
						: 0,
					latitude: user.profile.address?.latitude
						? Number(user.profile.address.latitude)
						: null,
					longitude: user.profile.address?.longitude
						? Number(user.profile.address.longitude)
						: null,
				},
			});
		}
	}, [user, reset]);

	useEffect(() => {
		if (selectedCity) {
			const city = cities?.find(c => c.nome === selectedCity);
			if (city) setValue("address.city_ibge_id", Number(city.codigo_ibge));
		}
	}, [cities, selectedCity, setValue]);

	const profileMutation = useMutation({
		mutationFn: async (data: ProfileFormValues) => {
			const profileData = {
				full_name: data.fullName,
				display_name: data.displayName,
				phone: data.phone.replace(/\D/g, ""),
				address: {
					zip_code: data.address.zip_code.replace(/\D/g, ""),
					street: data.address.street,
					number: data.address.number,
					complement: data.address.complement || "",
					district: data.address.district,
					city: data.address.city,
					city_ibge_id: data.address.city_ibge_id,
					state: data.address.state,
					state_code: data.address.state_code,
					state_ibge_id: data.address.state_ibge_id,
					latitude: data.address.latitude,
					longitude: data.address.longitude,
				},
			};

			return await putV1Profiles({ body: profileData });
		},
		onSuccess: response => {
			if (response.data?.profile) {
				updateUserProfile({ profile: response.data.profile });
			}
		},
		onError: () => {
			toast.error(
				"Erro ao salvar",
				"Ocorreu um problema ao atualizar seu perfil.",
			);
		},
	});

	const profileAvatarMutation = useMutation({
		mutationFn: async (asset: ImagePicker.ImagePickerAsset) => {
			const compressedUri = await compressImage(asset.uri, "avatar");
			const formData = new FormData();
			const file = {
				uri: compressedUri,
				name: asset.fileName ?? "image.jpg",
				type: "image/jpeg",
			} as unknown as Blob;
			formData.append("file", file);

			const response = await putV1ProfilesAvatar({
				body: formData as unknown as undefined,
			});

			return response.data;
		},
		onSuccess: data => {
			if (!data || !user?.profile) return;
			setValue("profileImage", data.url);
			updateUserProfile({
				profile: {
					...user.profile,
					profile_image: {
						id: data.id,
						url: data.url,
						file_name: data.file_name,
						path: data.path,
					},
				},
			});
		},
		onError: () => {
			toast.error(
				"Erro ao salvar imagem",
				"Ocorreu um problema ao atualizar sua foto.",
			);
		},
	});

	const getCepMutation = useMutation({
		mutationKey: ["get", "cep", "brasil-api"],
		mutationFn: async ({ cep }: { cep: string }) => {
			const response = await getCepV2({ path: { cep } });
			return response.data;
		},
		onSuccess: data => {
			if (!data) return;
			const current = control._formValues as ProfileFormValues;
			reset(
				{
					...current,
					address: {
						...current.address,
						zip_code: data.cep ? mask.cep(data.cep) : current.address.zip_code,
						street: data.street || current.address.street,
						district: data.neighborhood || current.address.district,
						city: data.city || current.address.city,
						state_code: data.state || current.address.state_code,
					},
				},
				{ keepDefaultValues: true },
			);
			const uf = states?.find(s => s.sigla === data.state);
			if (uf) {
				setValue("address.state", uf.nome);
				setValue("address.state_ibge_id", Number(uf.id));
			}
			setSelectedCity(data.city || null);
		},
		onError: () => {
			toast.error("Erro ao buscar cep", "Confira o cep e tente novamente");
		},
	});

	const onSubmit = async (data: ProfileFormValues) => {
		try {
			const promises = [];

			if (isDirty) {
				promises.push(profileMutation.mutateAsync(data));
			}

			if (selectedAsset.current) {
				promises.push(profileAvatarMutation.mutateAsync(selectedAsset.current));
			}

			if (promises.length > 0) {
				await Promise.all(promises);
				toast.success("Perfil atualizado!", "Suas informações foram salvas.");
				router.push("/(tabs)/(home)");
			}
		} catch (error) {
			console.log("Error submitting profile:", error);
		}
	};

	const onPressSearchCep = async ({ cep }: { cep: string }) => {
		const cleanCep = cep.replace(/\D/g, "");
		if (cleanCep.length !== 8) {
			toast.error("CEP inválido", "O CEP deve conter 8 dígitos.");
			return;
		}
		await getCepMutation.mutateAsync({ cep: cleanCep });
	};

	const onCancel = () => {
		reset();
	};

	const isLoading =
		profileMutation.isPending || profileAvatarMutation.isPending;

	const pickImage = async (onChange: (value: string) => void) => {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"],
			allowsEditing: true,
			aspect: [1, 1],
			quality: 1,
		});

		if (!result.canceled) {
			const asset = result.assets[0];
			selectedAsset.current = asset;
			onChange(asset.uri);
		}
	};

	useEffect(() => {
		if (!isLoading) {
			Animated.timing(contentOpacity, {
				toValue: 1,
				duration: 400,
				useNativeDriver: true,
			}).start();
		} else {
			contentOpacity.setValue(0);
		}
	}, [isLoading, contentOpacity]);

	return (
		<>
			<Stack.Screen options={{ title: "Perfil" }} />
			<KeyboardAvoidingView
				className="flex-1"
				behavior={Platform.OS === "ios" ? "padding" : "height"}
			>
				<ScrollView className="flex-1 bg-white p-4">
					<VStack className="gap-4">
						<View className="relative mb-12">
							<View className="h-28 items-center justify-center rounded-md bg-primary"></View>

							<Animated.View
								style={{ opacity: contentOpacity }}
								className="absolute left-1/2 top-24 -ml-8 -mt-8"
							>
								<Controller
									control={control}
									name="profileImage"
									render={({ field: { value, onChange } }) => (
										<View>
											<TouchableOpacity
												activeOpacity={0.7}
												onPress={() => pickImage(onChange)}
												className="rounded-md shadow-lg shadow-black/40"
											>
												<Image
													source={value ? { uri: value } : DefaultImage}
													style={{
														width: 80,
														height: 80,
														borderRadius: 6,
													}}
												/>
											</TouchableOpacity>
											<Button
												size="sm"
												variant="secondary"
												className="absolute bottom-0 right-0"
												onPress={() => pickImage(onChange)}
											>
												<ButtonIcon as={PencilIcon} />
											</Button>
										</View>
									)}
								/>
							</Animated.View>
						</View>

						<VStack className="gap-4">
							<Alert className="gap-3 bg-sky-100 border-sky-400">
								<AlertIcon as={InfoIcon} className="text-sky-400" />
								<AlertText className="text-foreground/80">
									O preenchimento das informações, visam manter a plataforma
									segura. Toda interação é registrada, porém ela não é pública,
									isso garante a todos mais comprometimento com as informações e
									ações dos usuários com a plataforma e a sociedade.
								</AlertText>
							</Alert>
							<View>
								<Heading>Perfil</Heading>
							</View>
							<View className="gap-3">
								<FormControl isInvalid={!!errors.fullName} className="gap-2">
									<FormControlLabel>
										<FormControlLabelText className="text-sm">
											Nome completo
										</FormControlLabelText>
									</FormControlLabel>
									<Controller
										control={control}
										name="fullName"
										render={({ field: { onChange, onBlur, value } }) => (
											<Input>
												<InputField
													value={value}
													onBlur={onBlur}
													onChangeText={onChange}
													placeholder="Emanuel Ribeiro de Souza"
												/>
											</Input>
										)}
									/>
									{errors.fullName?.message ? (
										<FormControlError>
											<FormControlErrorIcon as={AlertCircleIcon} />
											<FormControlErrorText>
												{errors.fullName.message}
											</FormControlErrorText>
										</FormControlError>
									) : null}
								</FormControl>

								<FormControl isInvalid={!!errors.displayName} className="gap-2">
									<FormControlLabel>
										<FormControlLabelText className="text-sm">
											Como gostaria de ser chamado?
										</FormControlLabelText>
									</FormControlLabel>
									<Controller
										control={control}
										name="displayName"
										render={({ field: { onChange, onBlur, value } }) => (
											<Input>
												<InputField
													value={value}
													onBlur={onBlur}
													onChangeText={onChange}
													placeholder="Emanuel"
												/>
											</Input>
										)}
									/>
									{errors.displayName?.message ? (
										<FormControlError>
											<FormControlErrorIcon as={AlertCircleIcon} />
											<FormControlErrorText>
												{errors.displayName.message}
											</FormControlErrorText>
										</FormControlError>
									) : null}
								</FormControl>

								<FormControl isInvalid={!!errors.phone} className="gap-2">
									<FormControlLabel>
										<FormControlLabelText className="text-sm">
											Celular
										</FormControlLabelText>
									</FormControlLabel>
									<Controller
										control={control}
										name="phone"
										render={({ field: { onChange, onBlur, value } }) => (
											<Input>
												<InputField
													value={value}
													onBlur={onBlur}
													onChangeText={text => onChange(mask.phoneBr(text))}
													keyboardType="phone-pad"
													maxLength={15}
												/>
											</Input>
										)}
									/>
									{errors.phone?.message ? (
										<FormControlError>
											<FormControlErrorIcon as={AlertCircleIcon} />
											<FormControlErrorText>
												{errors.phone.message}
											</FormControlErrorText>
										</FormControlError>
									) : null}
								</FormControl>
							</View>

							<View>
								<Heading>Endereço</Heading>
							</View>
							<View className="gap-3">
								<FormControl
									isInvalid={!!errors.address?.zip_code}
									className="gap-2"
								>
									<FormControlLabel>
										<FormControlLabelText className="text-sm">
											CEP
										</FormControlLabelText>
									</FormControlLabel>
									<Controller
										control={control}
										name="address.zip_code"
										render={({ field: { onChange, onBlur, value } }) => (
											<Input>
												<InputField
													value={value}
													onBlur={onBlur}
													onChangeText={text => onChange(mask.cep(text))}
													keyboardType="number-pad"
													maxLength={9}
												/>
												<InputSlot
													className="pr-3"
													onPress={() => onPressSearchCep({ cep: value })}
												>
													<InputIcon
														as={getCepMutation.isPending ? Spinner : Search}
													/>
												</InputSlot>
											</Input>
										)}
									/>
									{errors.address?.zip_code?.message ? (
										<FormControlError>
											<FormControlErrorText>
												{errors.address.zip_code.message}
											</FormControlErrorText>
										</FormControlError>
									) : null}
								</FormControl>

								<View className="flex flex-row gap-2">
									<FormControl
										isInvalid={!!errors.address?.street}
										className="flex-1 gap-2"
									>
										<FormControlLabel>
											<FormControlLabelText className="text-sm">
												Rua
											</FormControlLabelText>
										</FormControlLabel>
										<Controller
											control={control}
											name="address.street"
											render={({ field: { onChange, onBlur, value } }) => (
												<Input>
													<InputField
														value={value}
														onBlur={onBlur}
														onChangeText={onChange}
													/>
												</Input>
											)}
										/>
										{errors.address?.street?.message ? (
											<FormControlError>
												<FormControlErrorIcon as={AlertCircleIcon} />
												<FormControlErrorText>
													{errors.address.street.message}
												</FormControlErrorText>
											</FormControlError>
										) : null}
									</FormControl>

									<FormControl
										isInvalid={!!errors.address?.number}
										className="w-20 gap-2"
									>
										<FormControlLabel>
											<FormControlLabelText className="text-sm">
												Número
											</FormControlLabelText>
										</FormControlLabel>
										<Controller
											control={control}
											name="address.number"
											render={({ field: { onChange, onBlur, value } }) => (
												<Input>
													<InputField
														value={value}
														onBlur={onBlur}
														onChangeText={onChange}
													/>
												</Input>
											)}
										/>
										{errors.address?.number?.message ? (
											<FormControlError>
												<FormControlErrorIcon as={AlertCircleIcon} />
												<FormControlErrorText>
													{errors.address.number.message}
												</FormControlErrorText>
											</FormControlError>
										) : null}
									</FormControl>
								</View>

								<FormControl
									isInvalid={!!errors.address?.complement}
									className="gap-2"
								>
									<FormControlLabel>
										<FormControlLabelText className="text-sm">
											Complemento
										</FormControlLabelText>
									</FormControlLabel>
									<Controller
										control={control}
										name="address.complement"
										render={({ field: { onChange, onBlur, value } }) => (
											<Input>
												<InputField
													value={value || ""}
													onBlur={onBlur}
													onChangeText={onChange}
												/>
											</Input>
										)}
									/>
									{errors.address?.complement?.message ? (
										<FormControlError>
											<FormControlErrorIcon as={AlertCircleIcon} />
											<FormControlErrorText>
												{errors.address.complement.message}
											</FormControlErrorText>
										</FormControlError>
									) : null}
								</FormControl>

								<FormControl
									isInvalid={!!errors.address?.district}
									className="gap-2"
								>
									<FormControlLabel>
										<FormControlLabelText className="text-sm">
											Bairro
										</FormControlLabelText>
									</FormControlLabel>
									<Controller
										control={control}
										name="address.district"
										render={({ field: { onChange, onBlur, value } }) => (
											<Input>
												<InputField
													value={value}
													onBlur={onBlur}
													onChangeText={onChange}
												/>
											</Input>
										)}
									/>
									{errors.address?.district?.message ? (
										<FormControlError>
											<FormControlErrorIcon as={AlertCircleIcon} />
											<FormControlErrorText>
												{errors.address.district.message}
											</FormControlErrorText>
										</FormControlError>
									) : null}
								</FormControl>

								<View className="flex flex-col gap-3">
									<View className="flex flex-row gap-2">
										<FormControl
											isInvalid={!!errors.address?.state}
											className="flex-1 gap-2"
										>
											<FormControlLabel>
												<FormControlLabelText className="text-sm">
													Estado
												</FormControlLabelText>
											</FormControlLabel>
											<Controller
												control={control}
												name="address.state"
												render={({ field: { value, onChange } }) => (
													<Select
														selectedValue={value}
														onValueChange={val => {
															onChange(val);
															const state = states?.find(s => s.nome === val);
															if (state) {
																setValue("address.state_code", state.sigla);
																setValue(
																	"address.state_ibge_id",
																	Number(state.id),
																);
															}
														}}
													>
														<SelectTrigger
															size="sm"
															className={cn(
																"justify-between",
																Platform.OS === "android" ? "px-3" : "pr-3",
															)}
														>
															<SelectInput
																placeholder="Selecione o estado"
																className="flex-1"
															/>
															<SelectIcon
																as={isPendingStates ? Spinner : ChevronDown}
															/>
														</SelectTrigger>
														<SelectPortal>
															<SelectBackdrop />
															<SelectContent>
																<SelectDragIndicatorWrapper>
																	<SelectDragIndicator />
																</SelectDragIndicatorWrapper>
																<ScrollView className="w-full max-h-80">
																	{states ? (
																		states.map(state => (
																			<SelectItem
																				key={state.id}
																				label={state.nome}
																				value={state.nome}
																			/>
																		))
																	) : (
																		<SelectItem
																			label="Não há dados para mostrar"
																			value=""
																		/>
																	)}
																</ScrollView>
															</SelectContent>
														</SelectPortal>
													</Select>
												)}
											/>
											{errors.address?.state?.message && (
												<FormControlError>
													<FormControlErrorIcon as={AlertCircleIcon} />
													<FormControlErrorText>
														{errors.address.state.message}
													</FormControlErrorText>
												</FormControlError>
											)}
										</FormControl>

										<FormControl
											isInvalid={!!errors.address?.state_code}
											isReadOnly
											className="w-20 gap-2"
										>
											<FormControlLabel>
												<FormControlLabelText className="text-sm">
													Sigla
												</FormControlLabelText>
											</FormControlLabel>
											<Controller
												control={control}
												name="address.state_code"
												render={({ field: { value } }) => (
													<Input isReadOnly>
														<InputField value={value} />
													</Input>
												)}
											/>
											{errors.address?.state_code?.message && (
												<FormControlError>
													<FormControlErrorIcon as={AlertCircleIcon} />
													<FormControlErrorText>
														{errors.address.state_code.message}
													</FormControlErrorText>
												</FormControlError>
											)}
										</FormControl>
									</View>

									<FormControl
										isInvalid={!!errors.address?.city}
										className="gap-2"
									>
										<FormControlLabel>
											<FormControlLabelText className="text-sm">
												Cidade
											</FormControlLabelText>
										</FormControlLabel>
										<Controller
											control={control}
											name="address.city"
											render={({ field: { value, onChange } }) => (
												<Select
													selectedValue={value}
													onValueChange={val => {
														onChange(val);
														const city = cities?.find(c => c.nome === val);
														if (city) {
															setValue(
																"address.city_ibge_id",
																Number(city.codigo_ibge),
															);
														}
													}}
												>
													<SelectTrigger
														size="sm"
														className={cn(
															"justify-between",
															Platform.OS === "android" ? "px-3" : "pr-3",
														)}
													>
														<SelectInput
															placeholder="Selecione a cidade"
															className="flex-1 capitalize"
														/>
														<SelectIcon
															as={isPendingCities ? Spinner : ChevronDown}
														/>
													</SelectTrigger>
													<SelectPortal>
														<SelectBackdrop />
														<SelectContent>
															<SelectDragIndicatorWrapper>
																<SelectDragIndicator />
															</SelectDragIndicatorWrapper>
															<ScrollView className="w-full max-h-80">
																{cities ? (
																	cities.map(city => (
																		<SelectItem
																			key={city.codigo_ibge}
																			label={city.nome}
																			value={city.nome}
																			className="capitalize"
																		/>
																	))
																) : (
																	<SelectItem
																		label="Selecione um estado"
																		value=""
																	/>
																)}
															</ScrollView>
														</SelectContent>
													</SelectPortal>
												</Select>
											)}
										/>
										{errors.address?.city?.message && (
											<FormControlError>
												<FormControlErrorIcon as={AlertCircleIcon} />
												<FormControlErrorText>
													{errors.address.city.message}
												</FormControlErrorText>
											</FormControlError>
										)}
									</FormControl>
								</View>

								<FormControl
									isInvalid={
										!!errors.address?.latitude || !!errors.address?.longitude
									}
									className="gap-2"
								>
									<FormControlLabel>
										<FormControlLabelText className="text-sm">
											Localização no Mapa
										</FormControlLabelText>
									</FormControlLabel>
									<Controller
										control={control}
										name="address"
										render={({ field: { value } }) => (
											<WrapperMap
												latitude={value.latitude}
												longitude={value.longitude}
												onChange={loc => {
													setValue("address.latitude", loc.latitude);
													setValue("address.longitude", loc.longitude);
												}}
											/>
										)}
									/>
									{(errors.address?.latitude || errors.address?.longitude) && (
										<FormControlError>
											<FormControlErrorIcon as={AlertCircleIcon} />
											<FormControlErrorText>
												{errors.address?.latitude?.message ||
													errors.address?.longitude?.message ||
													"Localização inválida"}
											</FormControlErrorText>
										</FormControlError>
									)}
								</FormControl>
							</View>
						</VStack>
						<View className="flex flex-row gap-2 pb-10 pt-4">
							<Button
								variant="outline"
								className="flex-1"
								onPress={onCancel}
								isDisabled={!isDirty}
							>
								<ButtonText>Cancelar</ButtonText>
							</Button>
							<Button
								className="flex-1"
								onPress={handleSubmit(onSubmit)}
								isDisabled={isLoading || (!isDirty && !selectedAsset.current)}
							>
								<ButtonText>Confirmar</ButtonText>
								{isLoading && <ButtonSpinner />}
							</Button>
						</View>
					</VStack>
				</ScrollView>
			</KeyboardAvoidingView>
		</>
	);
}
