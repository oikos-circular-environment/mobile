import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import {
	AlertCircleIcon,
	Check,
	ChevronDown,
	Search,
} from "lucide-react-native";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import {
	Image,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	View,
} from "react-native";
import { z } from "zod";
import DefaultImage from "@/assets/icons/icon.png";
import { toast } from "@/components/toast";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Checkbox,
	CheckboxIcon,
	CheckboxIndicator,
	CheckboxLabel,
} from "@/components/ui/checkbox";
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
import WrapperMapper from "@/components/wrapper-mapper";
import { useUserContext } from "@/contexts/user-context";
import {
	type GetCepV2BrasilApiParams,
	getAllStatesV1BrasilApi,
	getCepV2BrasilApi,
	getCitiesByStateV1BrasilApi,
} from "@/libs/brasil-api/client";
import { putV1Profiles } from "@/libs/client";
import { mask } from "@/libs/mask";

const profileSchema = z.object({
	fullName: z.string().min(3, "Informe seu nome completo."),
	displayName: z.string().min(2, "Informe como prefere ser chamado."),
	cpf: z
		.string()
		.regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "Informe um CPF valido."),
	phone: z
		.string()
		.regex(/^\(\d{2}\)\s(\d\s)?\d{4}-\d{4}$/, "Informe um celular valido."),
	is_collector: z.boolean(),
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
	const { user, updateUserProfile } = useUserContext();
	const router = useRouter();

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
			cpf: user?.profile?.cpf ? mask.cpf(user.profile.cpf) : "",
			phone: user?.profile?.phone ? mask.phoneBr(user.profile.phone) : "",
			is_collector: user?.profile?.is_collector || false,
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

	const { data: states = [] } = useQuery({
		queryKey: ["states"],
		queryFn: async () => {
			const response = await getAllStatesV1BrasilApi();
			return response.data;
		},
		staleTime: 1000 * 60 * 60 * 24, // 24 hours
	});

	const { data: cities = [] } = useQuery({
		queryKey: ["cities", selectedStateCode],
		queryFn: async () => {
			const response = await getCitiesByStateV1BrasilApi({
				code: selectedStateCode,
			});
			return response.data;
		},
		enabled: !!selectedStateCode && selectedStateCode.length === 2,
	});

	useEffect(() => {
		if (user?.profile) {
			reset({
				fullName: user.profile.full_name || "",
				displayName: user.profile.display_name || "",
				cpf: user.profile.cpf ? mask.cpf(user.profile.cpf) : "",
				phone: user.profile.phone ? mask.phoneBr(user.profile.phone) : "",
				is_collector: user.profile.is_collector || false,
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

	const profileMutation = useMutation({
		mutationFn: async (data: ProfileFormValues) => {
			const profileData = {
				full_name: data.fullName,
				display_name: data.displayName,
				cpf: data.cpf.replace(/\D/g, ""),
				phone: data.phone.replace(/\D/g, ""),
				is_collector: data.is_collector,
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
				toast.success("Perfil atualizado!", "Suas informações foram salvas.");
			}
			router.push("/(tabs)/(home)");
		},
		onError: error => {
			console.log("Error:", error);
			toast.error(
				"Erro ao salvar",
				"Ocorreu um problema ao atualizar seu perfil.",
			);
		},
	});

	const getCepMutation = useMutation({
		mutationKey: ["get", "cep", "brasil-api"],
		mutationFn: async ({ cep }: GetCepV2BrasilApiParams) => {
			const response = await getCepV2BrasilApi({ cep });
			return response.data;
		},
		onSuccess: data => {
			if (data) {
				const currentValues = control._formValues as ProfileFormValues;
				reset(
					{
						...currentValues,
						address: {
							...currentValues.address,
							zip_code: data.cep
								? mask.cep(data.cep)
								: currentValues.address.zip_code,
							street: data.street || currentValues.address.street,
							district: data.neighborhood || currentValues.address.district,
							city: data.city || currentValues.address.city,
							state: data.state || currentValues.address.state,
							state_code: data.state || currentValues.address.state_code,
							state_ibge_id: currentValues.address.state_ibge_id,
							city_ibge_id: currentValues.address.city_ibge_id,
						},
					},
					{ keepDefaultValues: true },
				);

				// Se o estado mudou via CEP, precisamos atualizar o nome do estado se possível
				if (data.state) {
					getAllStatesV1BrasilApi().then(res => {
						const state = res.data.find(s => s.sigla === data.state);
						if (state) {
							setValue("address.state", state.nome);
							setValue("address.state_ibge_id", Number(state.id));
						}
					});
				}
			}
		},
		onError: () => {
			toast.error("Erro ao buscar cep", "Confira o cep e tente novamente");
		},
	});

	const onSubmit = async (data: ProfileFormValues) => {
		await profileMutation.mutateAsync(data);
	};

	const onPressSearchCep = async ({ cep }: GetCepV2BrasilApiParams) => {
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

	const isLoading = profileMutation.isPending;

	return (
		<>
			<Stack.Screen options={{ title: "Perfil" }} />
			<KeyboardAvoidingView
				className="flex-1"
				behavior={Platform.OS === "ios" ? "padding" : "height"}
			>
				<ScrollView className="flex-1 bg-white p-4">
					<View className="gap-2">
						<View className="relative mb-8">
							<View className="h-24 items-center justify-center rounded-md bg-primary">
								<Heading className="text-4xl text-primary-foreground">
									Oikos
								</Heading>
								<Button
									size="sm"
									variant="secondary"
									className="absolute bottom-1 right-1"
								>
									<ButtonText>Editar</ButtonText>
								</Button>
							</View>

							<View className="absolute left-1/2 top-full -ml-8 -mt-8">
								<View className="rounded-md shadow-lg shadow-black/40">
									<Image
										source={
											user?.profile?.profile_image?.url
												? { uri: user.profile.profile_image.url }
												: DefaultImage
										}
										className="size-16 rounded-md"
									/>
								</View>
								<Button
									size="sm"
									variant="secondary"
									className="absolute bottom-0 right-0"
								>
									<ButtonText>Editar</ButtonText>
								</Button>
							</View>
						</View>
					</View>

					<VStack className="gap-4">
						<Card className="shadow-none">
							<View>
								<Heading>Perfil</Heading>
							</View>
							<View className="gap-3">
								<View>
									<Controller
										control={control}
										name="is_collector"
										render={({ field: { value, onChange } }) => (
											<Card className="shadow-none" id="is_collector">
												<Checkbox
													id="is_collector"
													value="collector"
													isChecked={value}
													onChange={onChange}
												>
													<CheckboxIndicator className="data-[checked=true]:border-primary data-[checked=true]:bg-primary">
														<CheckboxIcon as={Check} />
													</CheckboxIndicator>
													<CheckboxLabel>
														Sou coletor independente
													</CheckboxLabel>
												</Checkbox>
											</Card>
										)}
									/>
								</View>

								<FormControl isInvalid={!!errors.cpf} className="gap-2">
									<FormControlLabel>
										<FormControlLabelText className="text-sm">
											CPF
										</FormControlLabelText>
									</FormControlLabel>
									<Controller
										control={control}
										name="cpf"
										render={({ field: { onChange, onBlur, value } }) => (
											<Input>
												<InputField
													value={value}
													onBlur={onBlur}
													onChangeText={text => onChange(mask.cpf(text))}
													keyboardType="number-pad"
													maxLength={14}
												/>
											</Input>
										)}
									/>
									{errors.cpf?.message ? (
										<FormControlError>
											<FormControlErrorText>
												{errors.cpf.message}
											</FormControlErrorText>
										</FormControlError>
									) : null}
								</FormControl>

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
						</Card>

						<Card className="shadow-none">
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
															const state = states.find(s => s.nome === val);
															if (state) {
																setValue("address.state_code", state.sigla);
																setValue(
																	"address.state_ibge_id",
																	Number(state.id),
																);
															}
														}}
													>
														<SelectTrigger>
															<SelectInput
																placeholder="Selecione o estado"
																className="flex-1"
															/>
															<SelectIcon className="mr-3" as={ChevronDown} />
														</SelectTrigger>
														<SelectPortal>
															<SelectBackdrop />
															<SelectContent>
																<SelectDragIndicatorWrapper>
																	<SelectDragIndicator />
																</SelectDragIndicatorWrapper>
																<ScrollView className="w-full max-h-80">
																	{states.map(state => (
																		<SelectItem
																			key={state.id}
																			label={state.nome}
																			value={state.nome}
																		/>
																	))}
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
														const city = cities.find(c => c.nome === val);
														if (city) {
															setValue(
																"address.city_ibge_id",
																Number(city.codigo_ibge),
															);
														}
													}}
												>
													<SelectTrigger>
														<SelectInput
															placeholder="Selecione a cidade"
															className="flex-1"
														/>
														<SelectIcon className="mr-3" as={ChevronDown} />
													</SelectTrigger>
													<SelectPortal>
														<SelectBackdrop />
														<SelectContent>
															<SelectDragIndicatorWrapper>
																<SelectDragIndicator />
															</SelectDragIndicatorWrapper>
															<ScrollView className="w-full max-h-80">
																{cities.map(city => (
																	<SelectItem
																		key={city.codigo_ibge}
																		label={city.nome}
																		value={city.nome}
																	/>
																))}
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
											<WrapperMapper
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
						</Card>
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
							isDisabled={isLoading || !isDirty}
						>
							<ButtonText>Confirmar</ButtonText>
							{isLoading && <ButtonSpinner />}
						</Button>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</>
	);
}
