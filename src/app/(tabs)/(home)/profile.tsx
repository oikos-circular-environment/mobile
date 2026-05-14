import { zodResolver } from "@hookform/resolvers/zod";
import { Stack } from "expo-router";
import { Check, Search } from "lucide-react-native";
import { useState } from "react";
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
import { Button, ButtonText } from "@/components/ui/button";
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
import { Text } from "@/components/ui/text";
import WrapperMapper from "@/components/wrapper-mapper";
import { useUserContext } from "@/contexts/user-context";
import { mask } from "@/libs/mask";

type ProfileTab = "profile" | "address";

const profileSchema = z.object({
	fullName: z.string().min(3, "Informe seu nome completo."),
	displayName: z.string().min(2, "Informe como prefere ser chamado."),
	cpf: z
		.string()
		.regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "Informe um CPF valido."),
	phone: z
		.string()
		.regex(/^\(\d{2}\)\s(\d\s)?\d{4}-\d{4}$/, "Informe um celular valido."),
	email: z.email("Informe um email valido."),
	is_collector: z.boolean(),
	address: z.object({
		zip_code: z.string().regex(/^\d{5}-\d{3}$/, "Informe um CEP valido."),
		street: z.string().min(3, "Informe a rua."),
		number: z.string().min(1, "Informe o numero."),
		complement: z.string().min(2, "Informe o complemento."),
		district: z.string().min(2, "Informe o bairro."),
		city: z.string().min(2, "Informe a cidade."),
		state: z.string().min(2, "Informe o estado."),
		stateCode: z.string().length(2, "Use a sigla com 2 letras."),
	}),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileScreen() {
	const { user } = useUserContext();
	const [activeTab, setActiveTab] = useState<ProfileTab>("profile");

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<ProfileFormValues>({
		resolver: zodResolver(profileSchema),
	});

	const onSubmit = (data: ProfileFormValues) => {
		console.log(data);
	};

	const onCancel = () => {
		reset();
	};

	return (
		<>
			<Stack.Screen options={{ title: "Perfil" }} />
			<KeyboardAvoidingView
				className="flex-1"
				behavior={Platform.OS === "ios" ? "padding" : "height"}
			>
				<ScrollView className="flex-1 bg-white p-4">
					<View className="flex gap-4 pb-8">
						<View className="flex flex-row items-center rounded-md border border-border p-1">
							<Button
								variant={activeTab === "profile" ? "secondary" : "ghost"}
								className="flex-1"
								onPress={() => setActiveTab("profile")}
							>
								<ButtonText>Perfil</ButtonText>
							</Button>
							<Button
								variant={activeTab === "address" ? "secondary" : "ghost"}
								className="flex-1"
								onPress={() => setActiveTab("address")}
							>
								<ButtonText>Endereço</ButtonText>
							</Button>
						</View>

						{activeTab === "profile" ? (
							<View className="gap-4">
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
														user?.profile.profile_image?.url || DefaultImage
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

								<View>
									<Controller
										control={control}
										name="is_collector"
										render={({ field: { value, onChange } }) => (
											<Checkbox
												value="collector"
												isChecked={value}
												onChange={onChange}
											>
												<CheckboxIndicator className="data-[checked=true]:border-primary data-[checked=true]:bg-primary">
													<CheckboxIcon as={Check} />
												</CheckboxIndicator>
												<CheckboxLabel>Sou coletor</CheckboxLabel>
											</Checkbox>
										)}
									/>
									<Text className="mt-2 text-xs text-muted-foreground">
										Ser coletor está sujeito a validação prévia
									</Text>
								</View>

								<View className="gap-3">
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

									<FormControl
										isInvalid={!!errors.displayName}
										className="gap-2"
									>
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

									<FormControl isInvalid={!!errors.email} className="gap-2">
										<FormControlLabel>
											<FormControlLabelText className="text-sm">
												Email
											</FormControlLabelText>
										</FormControlLabel>
										<Controller
											control={control}
											name="email"
											render={({ field: { onChange, onBlur, value } }) => (
												<Input>
													<InputField
														value={value}
														onBlur={onBlur}
														onChangeText={onChange}
														keyboardType="email-address"
														autoCapitalize="none"
													/>
												</Input>
											)}
										/>
										{errors.email?.message ? (
											<FormControlError>
												<FormControlErrorText>
													{errors.email.message}
												</FormControlErrorText>
											</FormControlError>
										) : null}
										<View>
											<Heading size="xs" className="text-muted-foreground">
												Este email pode ser diferente do email vinculado a sua
												conta para autenticação.
											</Heading>
										</View>
									</FormControl>
								</View>
							</View>
						) : (
							<View className="gap-4">
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
													<InputSlot>
														<InputIcon as={Search} />
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
														value={value}
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
											isInvalid={!!errors.address?.stateCode}
											className="w-16 gap-2"
										>
											<FormControlLabel>
												<FormControlLabelText className="text-sm">
													Sigla
												</FormControlLabelText>
											</FormControlLabel>
											<Controller
												control={control}
												name="address.stateCode"
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
							</View>
						)}

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
