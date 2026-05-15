import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { Check, Search } from "lucide-react-native";
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
	FormControlErrorText,
	FormControlLabel,
	FormControlLabelText,
} from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import WrapperMapper from "@/components/wrapper-mapper";
import { useUserContext } from "@/contexts/user-context";
import {
	type GetCepV2BrasilApiParams,
	getCepV2BrasilApi,
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
		zip_code: z.string().regex(/^\d{5}-\d{3}$/, "Informe um CEP valido."),
		street: z.string().min(3, "Informe a rua."),
		number: z.string().min(1, "Informe o numero."),
		complement: z.string().optional().nullable(),
		district: z.string().min(2, "Informe o bairro."),
		city: z.string().min(2, "Informe a cidade."),
		state: z.string().min(2, "Informe o estado."),
		state_code: z.string().length(2, "Use a sigla com 2 letras."),
	}),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileScreen() {
	const { user, updateUserProfile } = useUserContext();

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors },
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
				state: user?.profile?.address?.state || "",
				state_code: user?.profile?.address?.state_code || "",
			},
		},
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
					state: user.profile.address?.state || "",
					state_code: user.profile.address?.state_code || "",
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
					state: data.address.state,
					state_code: data.address.state_code,
				},
			};

			return await putV1Profiles({ body: profileData });
		},
		onSuccess: response => {
			if (response.data?.profile) {
				updateUserProfile({ profile: response.data.profile });
				toast.success("Perfil atualizado!", "Suas informações foram salvas.");
			}
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
							state: data.state || currentValues.address.state, // state da brasil api é a sigla apenas
							state_code: data.state || currentValues.address.state_code,
						},
					},
					{ keepDefaultValues: true },
				);
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
								</FormControl>

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
								</FormControl>

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
									</FormControl>

									<FormControl
										isInvalid={!!errors.address?.state_code}
										className="w-16 gap-2"
									>
										<FormControlLabel>
											<FormControlLabelText className="text-sm">
												Sigla
											</FormControlLabelText>
										</FormControlLabel>
										<Controller
											control={control}
											name="address.state_code"
											render={({ field: { onChange, onBlur, value } }) => (
												<Input>
													<InputField
														value={value}
														onBlur={onBlur}
														onChangeText={onChange}
														maxLength={2}
														autoCapitalize="characters"
													/>
												</Input>
											)}
										/>
									</FormControl>
								</View>

								<View className="gap-2">
									<Text className="text-sm">Mapa</Text>
									<WrapperMapper />
								</View>
							</View>
						</Card>
					</VStack>
					<View className="flex flex-row gap-2 pt-4">
						<Button variant="outline" className="flex-1" onPress={onCancel}>
							<ButtonText>Cancelar</ButtonText>
						</Button>
						<Button
							className="flex-1"
							onPress={handleSubmit(onSubmit)}
							isDisabled={isLoading}
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
