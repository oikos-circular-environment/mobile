import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
	AlertCircleIcon,
	ChevronDown,
	MapIcon,
	Search,
} from "lucide-react-native";
import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { z } from "zod";
import { useCompanyAddress } from "@/components/companies/hooks/use-company-address";
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
import { VStack } from "@/components/ui/vstack";
import WrapperMap from "@/components/wrapper-map";
import { mask } from "@/libs/mask";
import { useRouteInteractive } from "@/libs/use-route-interactive";
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
	useRouteInteractive();
	const router = useRouter();
	const { companyId } = useLocalSearchParams<{ companyId: string }>();

	const company = useCompaniesStore(s =>
		s.companies.find(c => c.id === companyId),
	);
	const isLoadingAddress = useCompaniesStore(s => !s.isLoaded);
	const { mutateAsync: saveAddress, isPending: isSavingAddress } =
		useSaveAddress(companyId);

	const defaultValues = useMemo<AddressFormValues>(
		() => ({
			zip_code: company?.address?.zip_code ?? "",
			street: company?.address?.street ?? "",
			number: company?.address?.number ?? "",
			complement: company?.address?.complement ?? null,
			district: company?.address?.district ?? "",
			city: company?.address?.city ?? "",
			state: company?.address?.state ?? "",
			state_code: company?.address?.state_code ?? "",
			state_ibge_id: company?.address?.state_ibge_id ?? 0,
			city_ibge_id: company?.address?.city_ibge_id ?? 0,
			latitude: company?.address?.latitude ?? null,
			longitude: company?.address?.longitude ?? null,
		}),
		[company?.address],
	);

	const {
		control,
		handleSubmit,
		reset,
		setValue,
		getValues,
		watch,
		formState: { errors, isDirty },
	} = useForm<AddressFormValues>({
		resolver: zodResolver(addressSchema),
		defaultValues,
	});

	const selectedStateCode = watch("state_code");
	const latitude = watch("latitude");
	const longitude = watch("longitude");

	const {
		states,
		cities,
		isPendingStates,
		isPendingCities,
		isResolvingCep,
		searchCep,
	} = useCompanyAddress(selectedStateCode);

	useEffect(() => {
		reset(defaultValues);
	}, [defaultValues, reset]);

	const onPressSearchCep = async () => {
		const digits = getValues("zip_code").replace(/\D/g, "");
		if (digits.length !== 8) {
			toast.error("CEP inválido", "O CEP deve conter 8 dígitos.");
			return;
		}
		try {
			const resolved = await searchCep(digits);
			reset({ ...getValues(), ...resolved }, { keepDefaultValues: true });
		} catch {
			toast.error(
				"CEP não encontrado",
				"Verifique o número e tente novamente.",
			);
		}
	};

	const onStateChange = (
		stateName: string,
		rhfOnChange: (v: string) => void,
	) => {
		rhfOnChange(stateName);
		const uf = states?.find(s => s.nome === stateName);
		if (uf) {
			setValue("state_code", uf.sigla);
			setValue("state_ibge_id", Number(uf.id));
		}
	};

	const onCityChange = (cityName: string, rhfOnChange: (v: string) => void) => {
		rhfOnChange(cityName);
		const city = cities?.find(c => c.nome === cityName);
		if (city) {
			setValue("city_ibge_id", Number(city.codigo_ibge));
		}
	};

	const onLocationChange = (location: {
		latitude: number;
		longitude: number;
	}) => {
		setValue("latitude", location.latitude, { shouldDirty: true });
		setValue("longitude", location.longitude, { shouldDirty: true });
	};

	const onSubmit = handleSubmit(async data => {
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
		router.back();
	});

	const onCancel = () => reset(defaultValues);

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
								<Text className="text-sm">
									Estes dados serão expostos na plataforma, o preenchimento com
									informações reais trazem mais confiabilidade para os usuários
									da plataforma.
								</Text>
							</View>
						</View>
					</Card>

					<VStack>
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
												testID="input-zip-code"
												value={value}
												onBlur={onBlur}
												onChangeText={text => onChange(mask.cep(text))}
												keyboardType="default"
												autoCorrect={false}
												autoCapitalize="none"
												spellCheck={false}
												maxLength={9}
												placeholder="00000-000"
												returnKeyType="search"
												onSubmitEditing={onPressSearchCep}
											/>
											<InputSlot className="pr-3" testID="cep-search-btn">
												<InputIcon as={isResolvingCep ? Spinner : Search} />
											</InputSlot>
										</Input>
									)}
								/>
								{errors.zip_code?.message && (
									<FormControlError>
										<FormControlErrorIcon as={AlertCircleIcon} />
										<FormControlErrorText>
											{errors.zip_code.message}
										</FormControlErrorText>
									</FormControlError>
								)}
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
													testID="input-street"
													value={value}
													onBlur={onBlur}
													onChangeText={onChange}
													placeholder="Rua das Flores"
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
													testID="input-number"
													value={value}
													onBlur={onBlur}
													onChangeText={onChange}
													placeholder="123"
												/>
											</Input>
										)}
									/>
									{errors.number?.message && (
										<FormControlError>
											<FormControlErrorIcon as={AlertCircleIcon} />
											<FormControlErrorText>
												{errors.number.message}
											</FormControlErrorText>
										</FormControlError>
									)}
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
												testID="input-complement"
												value={value ?? ""}
												onBlur={onBlur}
												onChangeText={onChange}
												placeholder="Apto 42"
											/>
										</Input>
									)}
								/>
								{errors.complement?.message && (
									<FormControlError>
										<FormControlErrorIcon as={AlertCircleIcon} />
										<FormControlErrorText>
											{errors.complement.message}
										</FormControlErrorText>
									</FormControlError>
								)}
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
												testID="input-district"
												value={value}
												onBlur={onBlur}
												onChangeText={onChange}
												placeholder="Centro"
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
										render={({ field: { onChange, value } }) => (
											<Select
												selectedValue={value}
												onValueChange={val => onStateChange(val, onChange)}
											>
												<SelectTrigger
													size="sm"
													className={cn(
														"justify-between",
														Platform.OS === "android" ? "px-3" : "pr-3",
													)}
												>
													<SelectInput
														testID="input-state"
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
									{(errors.state?.message || errors.state_ibge_id?.message) && (
										<FormControlError>
											<FormControlErrorIcon as={AlertCircleIcon} />
											<FormControlErrorText>
												{errors.state?.message ?? errors.state_ibge_id?.message}
											</FormControlErrorText>
										</FormControlError>
									)}
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
												<InputField value={value} placeholder="SP" />
											</Input>
										)}
									/>
								</FormControl>
							</View>

							<FormControl
								isInvalid={!!errors.city || !!errors.city_ibge_id}
								className="gap-2"
							>
								<FormControlLabel>
									<FormControlLabelText className="text-sm">
										Cidade
									</FormControlLabelText>
								</FormControlLabel>
								<Controller
									control={control}
									name="city"
									render={({ field: { onChange, value } }) => (
										<Select
											selectedValue={value}
											onValueChange={val => onCityChange(val, onChange)}
										>
											<SelectTrigger>
												<SelectInput
													testID="input-city"
													placeholder="Selecione a cidade"
													className="flex-1 capitalize"
												/>
												<SelectIcon
													className="mr-3"
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
															cities.map(c => (
																<SelectItem
																	key={c.codigo_ibge}
																	label={c.nome}
																	value={c.nome}
																	className="capitalize"
																/>
															))
														) : (
															<SelectItem
																label="Selecione um estado primeiro"
																value=""
															/>
														)}
													</ScrollView>
												</SelectContent>
											</SelectPortal>
										</Select>
									)}
								/>
								{(errors.city?.message || errors.city_ibge_id?.message) && (
									<FormControlError>
										<FormControlErrorIcon as={AlertCircleIcon} />
										<FormControlErrorText>
											{errors.city?.message ?? errors.city_ibge_id?.message}
										</FormControlErrorText>
									</FormControlError>
								)}
							</FormControl>

							<View className="gap-2">
								<Text className="text-sm">Mapa</Text>
								<WrapperMap
									latitude={latitude}
									longitude={longitude}
									onChange={onLocationChange}
								/>
							</View>
						</View>

						<View className="flex flex-row gap-2 pt-4">
							<Button
								testID="btn-cancel"
								variant="outline"
								className="flex-1"
								onPress={onCancel}
								isDisabled={!isDirty || isSavingAddress}
							>
								<ButtonText>Cancelar</ButtonText>
							</Button>
							<Button
								testID="btn-save"
								className="flex-1"
								onPress={onSubmit}
								isDisabled={!isDirty || isSavingAddress}
							>
								<ButtonText>Salvar</ButtonText>
								{isSavingAddress && <ButtonIcon as={Spinner} />}
							</Button>
						</View>
					</VStack>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}
