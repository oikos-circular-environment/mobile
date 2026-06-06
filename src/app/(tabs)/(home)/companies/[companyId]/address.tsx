import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import {
	AlertCircleIcon,
	ChevronDown,
	MapIcon,
	Search,
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { z } from "zod";
import { useSaveAddress } from "@/components/companies/hooks/use-save-address";
import { AddressFormSkeleton } from "@/components/companies/skeletons";
import { colors } from "@/components/style/colors";
import { toast } from "@/components/toast";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { Text } from "@/components/ui/text";
import WrapperMap from "@/components/wrapper-map";
import {
	getCepV2,
	listIbgeMunicipios,
	listIbgeUfs,
} from "@/libs/brasil-api-sdk";
import { mask } from "@/libs/mask";
import { cn } from "@/libs/utils";
import { useCompaniesStore } from "@/stores/companies-store";

const addressSchema = z.object({
	zip_code: z.string().regex(/^\d{5}-\d{3}$/, "Informe um CEP válido."),
	street: z.string().min(3, "Informe a rua."),
	number: z.string().min(1, "Informe o número."),
	complement: z.string().optional().nullable(),
	district: z.string().min(2, "Informe o bairro."),
	city: z.string().min(2, "Informe a cidade."),
	state: z.string().min(2, "Informe o estado."),
	state_code: z.string().length(2, "Use a sigla com 2 letras."),
	state_ibge_id: z.number().min(1, "Selecione um estado."),
	city_ibge_id: z.number().min(1, "Selecione uma cidade."),
	latitude: z.number().nullable().optional(),
	longitude: z.number().nullable().optional(),
});

type AddressFormValues = z.infer<typeof addressSchema>;

export default function CompanyAddressScreen() {
	const { companyId } = useLocalSearchParams<{ companyId: string }>();
	const company = useCompaniesStore(s =>
		s.companies.find(c => c.id === companyId),
	);
	const address = company?.address;
	const isLoadingAddress = useCompaniesStore(s => !s.isLoaded);
	const { mutateAsync: saveAddress, isPending: isSavingAddress } =
		useSaveAddress(companyId);
	const [selectedCity, setSelectedCity] = useState<string | null>(null);
	const defaultValues = useMemo<AddressFormValues>(
		() => ({
			zip_code: address?.zip_code ?? "",
			street: address?.street ?? "",
			number: address?.number ?? "",
			complement: address?.complement ?? null,
			district: address?.district ?? "",
			city: address?.city ?? "",
			state: address?.state ?? "",
			state_code: address?.state_code ?? "",
			state_ibge_id: address?.state_ibge_id ?? 0,
			city_ibge_id: address?.city_ibge_id ?? 0,
			latitude: address?.latitude ?? null,
			longitude: address?.longitude ?? null,
		}),
		[address],
	);

	const {
		control,
		handleSubmit,
		reset,
		setValue,
		watch,
		formState: { errors, isDirty },
	} = useForm<AddressFormValues>({
		resolver: zodResolver(addressSchema),
		defaultValues,
	});

	const latitude = watch("latitude");
	const longitude = watch("longitude");
	const selectedStateCode = watch("state_code");

	const { data: states, isPending: isPendingStates } = useQuery({
		queryKey: ["states"],
		queryFn: async () => {
			const res = await listIbgeUfs();
			return res.data
				? res.data.sort((a, b) => a.nome.localeCompare(b.nome))
				: [];
		},
		staleTime: 1000 * 60 * 60 * 24,
	});

	const { data: cities, isPending: isPendingCities } = useQuery({
		queryKey: ["cities", selectedStateCode],
		queryFn: async () => {
			const res = await listIbgeMunicipios({
				path: { siglaUF: selectedStateCode },
			});
			return res.data
				? res.data.sort((a, b) => a.nome.localeCompare(b.nome))
				: [];
		},
		enabled: !!selectedStateCode && selectedStateCode.length === 2,
	});

	const onSubmit = async (data: AddressFormValues) => {
		await saveAddress({
			zip_code: data.zip_code,
			street: data.street,
			number: data.number,
			complement: data.complement ?? null,
			district: data.district,
			city: data.city,
			state: data.state,
			state_code: data.state_code,
			latitude: data.latitude ?? 0,
			longitude: data.longitude ?? 0,
			city_ibge_id: data.city_ibge_id,
			state_ibge_id: data.state_ibge_id,
		});
	};

	const onCancel = () => {
		reset(defaultValues);
	};

	const handleLocationChange = (location: {
		latitude: number;
		longitude: number;
	}) => {
		setValue("latitude", location.latitude, { shouldDirty: true });
		setValue("longitude", location.longitude, { shouldDirty: true });
	};

	const getCepMutation = useMutation({
		mutationKey: ["get", "cep", "brasil-api"],
		mutationFn: async ({ cep }: { cep: string }) => {
			const response = await getCepV2({ path: { cep } });
			return response.data;
		},
		onSuccess: data => {
			if (!data) return;
			const current = control._formValues as AddressFormValues;
			reset(
				{
					...current,
					zip_code: mask.cep(data.cep),
					street: data.street ?? current.street,
					district: data.neighborhood ?? current.district,
					city: data.city,
					state_code: data.state,
				},
				{ keepDefaultValues: true },
			);

			const uf = states?.find(state => state.sigla === data.state);
			if (uf) {
				setValue("state", uf.nome);
				setValue("state_code", uf.sigla);
				setValue("state_ibge_id", uf.id);
			}

			setSelectedCity(data.city);
		},
		onError: () => {
			toast.error(
				"CEP não encontrado",
				"Verifique o número e tente novamente.",
			);
		},
	});

	const onPressSearchCep = () => {
		const digits = (control._formValues.zip_code as string).replace(/\D/g, "");
		if (digits.length !== 8) {
			toast.error("CEP inválido", "O CEP deve conter 8 dígitos.");
			return;
		}
		getCepMutation.mutate({ cep: digits });
	};

	useEffect(() => {
		reset(defaultValues);
	}, [defaultValues, reset]);

	useEffect(() => {
		if (selectedCity) {
			const city = cities?.find(c => c.nome === selectedCity);
			if (city) {
				setValue("city_ibge_id", Number(city.codigo_ibge));
			}
		}
	}, [cities, selectedCity, setValue]);

	if (isLoadingAddress) {
		return <AddressFormSkeleton />;
	}

	return (
		<KeyboardAvoidingView behavior="padding" className="flex-1">
			<ScrollView
				className="flex-1 bg-white"
				contentContainerClassName="p-4 pb-8"
			>
				<View className="gap-4">
					<Card className="bg-secondary shadow-none">
						<View className="flex-row items-center justify-between gap-4">
							<View className="size-15 items-center justify-center rounded-lg bg-primary">
								<MapIcon color={colors.white} size={20} />
							</View>
							<View className="flex-1 gap-1">
								<Heading className="text-lg">Endereço</Heading>
								<Text className="text-sm ">
									Estes dados serão expostos na plataforma, o preenchimento com
									informações reais trazem mais confiabilidade para os usuários
									da plataforma.
								</Text>
							</View>
						</View>
					</Card>

					<Card className="shadow-none">
						<View className="gap-3">
							<FormControl isInvalid={!!errors.zip_code} className="gap-2">
								<FormControlLabel>
									<FormControlLabelText className="text-sm">
										CEP
									</FormControlLabelText>
								</FormControlLabel>
								<Controller
									control={control}
									name="zip_code"
									render={({ field: { onChange, onBlur, value } }) => (
										<Input>
											<InputField
												value={value}
												onBlur={onBlur}
												onChangeText={text => onChange(mask.cep(text))}
												keyboardType="number-pad"
												maxLength={9}
											/>
											<InputSlot className="pr-3" onPress={onPressSearchCep}>
												<InputIcon
													as={getCepMutation.isPending ? Spinner : Search}
												/>
											</InputSlot>
										</Input>
									)}
								/>
								{errors.zip_code?.message ? (
									<FormControlError>
										<FormControlErrorText>
											{errors.zip_code.message}
										</FormControlErrorText>
									</FormControlError>
								) : null}
							</FormControl>

							<View className="flex flex-row gap-2">
								<FormControl
									isInvalid={!!errors.street}
									className="flex-1 gap-2"
								>
									<FormControlLabel>
										<FormControlLabelText className="text-sm">
											Rua
										</FormControlLabelText>
									</FormControlLabel>
									<Controller
										control={control}
										name="street"
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
									{errors.street?.message ? (
										<FormControlError>
											<FormControlErrorText>
												{errors.street.message}
											</FormControlErrorText>
										</FormControlError>
									) : null}
								</FormControl>

								<FormControl isInvalid={!!errors.number} className="w-20 gap-2">
									<FormControlLabel>
										<FormControlLabelText className="text-sm">
											Número
										</FormControlLabelText>
									</FormControlLabel>
									<Controller
										control={control}
										name="number"
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
									{errors.number?.message ? (
										<FormControlError>
											<FormControlErrorText>
												{errors.number.message}
											</FormControlErrorText>
										</FormControlError>
									) : null}
								</FormControl>
							</View>

							<FormControl isInvalid={!!errors.complement} className="gap-2">
								<FormControlLabel>
									<FormControlLabelText className="text-sm">
										Complemento
									</FormControlLabelText>
								</FormControlLabel>
								<Controller
									control={control}
									name="complement"
									render={({ field: { onChange, onBlur, value } }) => (
										<Input>
											<InputField
												value={value ?? ""}
												onBlur={onBlur}
												onChangeText={onChange}
											/>
										</Input>
									)}
								/>
								{errors.complement?.message ? (
									<FormControlError>
										<FormControlErrorText>
											{errors.complement.message}
										</FormControlErrorText>
									</FormControlError>
								) : null}
							</FormControl>

							<FormControl isInvalid={!!errors.district} className="gap-2">
								<FormControlLabel>
									<FormControlLabelText className="text-sm">
										Bairro
									</FormControlLabelText>
								</FormControlLabel>
								<Controller
									control={control}
									name="district"
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
								{errors.district?.message ? (
									<FormControlError>
										<FormControlErrorText>
											{errors.district.message}
										</FormControlErrorText>
									</FormControlError>
								) : null}
							</FormControl>

							<View className="flex-row gap-2">
								<FormControl
									isInvalid={!!errors.state || !!errors.state_ibge_id}
									className="flex-1 gap-2"
								>
									<FormControlLabel>
										<FormControlLabelText className="text-sm">
											Estado
										</FormControlLabelText>
									</FormControlLabel>
									<Controller
										control={control}
										name="state"
										render={({ field: { value, onChange } }) => (
											<Select
												selectedValue={value}
												onValueChange={val => {
													onChange(val);
													const uf = states?.find(s => s.nome === val);
													if (uf) {
														setValue("state_code", uf.sigla);
														setValue("state_ibge_id", Number(uf.id));
														setValue("state", uf.nome);
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
																states.map(s => (
																	<SelectItem
																		key={s.id}
																		label={s.nome}
																		value={s.nome}
																	/>
																))
															) : (
																<SelectItem label="Não há dados" value="" />
															)}
														</ScrollView>
													</SelectContent>
												</SelectPortal>
											</Select>
										)}
									/>
									{errors.state?.message || errors.state_ibge_id?.message ? (
										<FormControlError>
											<FormControlErrorText>
												{errors.state?.message ?? errors.state_ibge_id?.message}
											</FormControlErrorText>
										</FormControlError>
									) : null}
								</FormControl>

								<FormControl isReadOnly className="w-16 gap-2">
									<FormControlLabel>
										<FormControlLabelText className="text-sm">
											Sigla
										</FormControlLabelText>
									</FormControlLabel>
									<Controller
										control={control}
										name="state_code"
										render={({ field: { value } }) => (
											<Input isReadOnly>
												<InputField value={value} />
											</Input>
										)}
									/>
								</FormControl>
							</View>

							<FormControl isInvalid={!!errors.city} className="gap-2">
								<FormControlLabel>
									<FormControlLabelText className="text-sm">
										Cidade
									</FormControlLabelText>
								</FormControlLabel>
								<Controller
									control={control}
									name="city"
									render={({ field: { value, onChange } }) => (
										<Select
											selectedValue={value}
											onValueChange={val => {
												onChange(val);
												const city = cities?.find(c => c.nome === val);
												if (city) {
													setValue("city_ibge_id", Number(city.codigo_ibge));
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
								{errors.city?.message && (
									<FormControlError>
										<FormControlErrorIcon as={AlertCircleIcon} />
										<FormControlErrorText>
											{errors.city.message}
										</FormControlErrorText>
									</FormControlError>
								)}
							</FormControl>

							<View className="gap-2">
								<Text className="text-sm">Mapa</Text>
								<WrapperMap
									latitude={latitude}
									longitude={longitude}
									onChange={handleLocationChange}
								/>
								<Text className="text-xs text-muted-foreground">
									{latitude != null && longitude != null
										? `Ponto selecionado: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
										: "Use o mapa para definir a localização exata da empresa."}
								</Text>
							</View>
						</View>

						<View className="flex flex-row gap-2 pt-4">
							<Button
								variant="outline"
								className="flex-1"
								onPress={onCancel}
								isDisabled={!isDirty || isSavingAddress}
							>
								<ButtonText>Cancelar</ButtonText>
							</Button>
							<Button
								className="flex-1"
								onPress={handleSubmit(onSubmit)}
								isDisabled={!isDirty || isSavingAddress}
							>
								<ButtonText>Salvar</ButtonText>
								{isSavingAddress && <ButtonIcon as={Spinner} />}
							</Button>
						</View>
					</Card>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}
