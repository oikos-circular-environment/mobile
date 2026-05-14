import { zodResolver } from "@hookform/resolvers/zod";
import { Stack } from "expo-router";
import { Search } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { z } from "zod";
import { Button, ButtonText } from "@/components/ui/button";
import {
	FormControl,
	FormControlError,
	FormControlErrorText,
	FormControlLabel,
	FormControlLabelText,
} from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import WrapperMapper from "@/components/wrapper-mapper";
import { mask } from "@/libs/mask";
import type { Address } from "@/libs/types/address";

const addressSchema = z.object({
	zip_code: z.string().regex(/^\d{5}-\d{3}$/, "Informe um CEP válido."),
	street: z.string().min(3, "Informe a rua."),
	number: z.string().min(1, "Informe o número."),
	complement: z.string().optional().nullable(),
	district: z.string().min(2, "Informe o bairro."),
	city: z.string().min(2, "Informe a cidade."),
	state: z.string().min(2, "Informe o estado."),
	state_code: z.string().length(2, "Use a sigla com 2 letras."),
	latitude: z.number().nullable().optional(),
	longitude: z.number().nullable().optional(),
});

type AddressFormValues = z.infer<typeof addressSchema>;

export default function CompanyAddressScreen() {
	const [address] = useState<Partial<Address>>({
		zip_code: "",
		street: "",
		number: "",
		complement: null,
		district: "",
		city: "",
		state: "",
		state_code: "",
	});

	const defaultValues = useMemo<AddressFormValues>(
		() => ({
			zip_code: address.zip_code ?? "",
			street: address.street ?? "",
			number: address.number ?? "",
			complement: address.complement ?? null,
			district: address.district ?? "",
			city: address.city ?? "",
			state: address.state ?? "",
			state_code: address.state_code ?? "",
			latitude: address.latitude ?? null,
			longitude: address.longitude ?? null,
		}),
		[address],
	);

	const {
		control,
		handleSubmit,
		reset,
		setValue,
		watch,
		formState: { errors, isSubmitting },
	} = useForm<AddressFormValues>({
		resolver: zodResolver(addressSchema),
		defaultValues,
	});

	const latitude = watch("latitude");
	const longitude = watch("longitude");

	useEffect(() => {
		reset(defaultValues);
	}, [defaultValues, reset]);

	const onSubmit = (data: AddressFormValues) => {
		console.log("Company address values", data);
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

	return (
		<>
			<Stack.Screen options={{ title: "Endereço da Empresa" }} />
			<KeyboardAvoidingView
				className="flex-1"
				behavior={Platform.OS === "ios" ? "padding" : "height"}
			>
				<ScrollView className="flex-1 bg-white p-4">
					<View className="flex gap-4 pb-8">
						<Heading size="xl">Endereço da Empresa</Heading>

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
											<InputSlot>
												<InputIcon as={Search} />
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

							<FormControl isInvalid={!!errors.city} className="gap-2">
								<FormControlLabel>
									<FormControlLabelText className="text-sm">
										Cidade
									</FormControlLabelText>
								</FormControlLabel>
								<Controller
									control={control}
									name="city"
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
								{errors.city?.message ? (
									<FormControlError>
										<FormControlErrorText>
											{errors.city.message}
										</FormControlErrorText>
									</FormControlError>
								) : null}
							</FormControl>

							<View className="flex flex-row gap-2">
								<FormControl
									isInvalid={!!errors.state}
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
									{errors.state?.message ? (
										<FormControlError>
											<FormControlErrorText>
												{errors.state.message}
											</FormControlErrorText>
										</FormControlError>
									) : null}
								</FormControl>

								<FormControl
									isInvalid={!!errors.state_code}
									className="w-16 gap-2"
								>
									<FormControlLabel>
										<FormControlLabelText className="text-sm">
											Sigla
										</FormControlLabelText>
									</FormControlLabel>
									<Controller
										control={control}
										name="state_code"
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
									{errors.state_code?.message ? (
										<FormControlError>
											<FormControlErrorText>
												{errors.state_code.message}
											</FormControlErrorText>
										</FormControlError>
									) : null}
								</FormControl>
							</View>

							<View className="gap-2">
								<Text className="text-sm">Mapa</Text>
								<WrapperMapper
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
							<Button variant="outline" className="flex-1" onPress={onCancel}>
								<ButtonText>Cancelar</ButtonText>
							</Button>
							<Button
								className="flex-1"
								onPress={handleSubmit(onSubmit)}
								isDisabled={isSubmitting}
							>
								<ButtonText>Confirmar</ButtonText>
							</Button>
						</View>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</>
	);
}
