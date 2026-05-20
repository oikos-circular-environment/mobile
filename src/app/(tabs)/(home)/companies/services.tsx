import { zodResolver } from "@hookform/resolvers/zod";
import { Stack } from "expo-router";
import {
	AlertCircle,
	ChevronDownIcon,
	DollarSignIcon,
	HashIcon,
	X,
} from "lucide-react-native";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	View,
} from "react-native";
import {
	type ServiceFormInput,
	type ServiceFormValues,
	serviceFormSchema,
} from "@/components/companies/services/services-form-schema";
import { ServicesListSkeleton } from "@/components/companies/skeletons";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	DecimalInput,
	DecimalInputField,
	DecimalInputIcon,
	DecimalInputSlot,
} from "@/components/ui/decimal-input";
import {
	FormControl,
	FormControlError,
	FormControlErrorIcon,
	FormControlErrorText,
	FormControlLabel,
	FormControlLabelText,
} from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
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
import { useUserCompanyContext } from "@/contexts/user-company-context";
import { measurements } from "@/libs/types/measurement";
import { wasteTypes } from "@/libs/types/waste";

export default function CompanyServicesScreen() {
	const { services, isLoadingServices, saveServices, isSavingServices } =
		useUserCompanyContext();

	const [subItemDraft, setSubItemDraft] = useState("");

	const form = useForm<ServiceFormInput, undefined, ServiceFormValues>({
		resolver: zodResolver(serviceFormSchema),
		defaultValues: {
			name: "",
			description: "",
			price: "0,00",
			quantity: "1,00",
			unit: "KG",
			wasteType: "RECYCLABLE",
			subItems: [],
			observations: "",
		},
		mode: "onChange",
	});

	const { control, formState, getValues, handleSubmit, setValue, watch } = form;
	const subItems = watch("subItems") ?? [];

	const onAddSubItem = () => {
		const nextSubItem = subItemDraft.trim();
		if (!nextSubItem) return;
		const currentSubItems = getValues("subItems") ?? [];
		if (currentSubItems.includes(nextSubItem)) {
			setSubItemDraft("");
			return;
		}
		setValue("subItems", [...currentSubItems, nextSubItem], {
			shouldDirty: true,
			shouldValidate: true,
		});
		setSubItemDraft("");
	};

	const onRemoveSubItem = (subItem: string) => {
		setValue(
			"subItems",
			(getValues("subItems") ?? []).filter(item => item !== subItem),
			{ shouldDirty: true, shouldValidate: true },
		);
	};

	const handleRemoveService = async (serviceId: string) => {
		const remaining = (services ?? []).filter(s => s.id !== serviceId);

		await saveServices({
			services: remaining.map(s => ({
				name: s.name,
				description: s.description ?? null,
				price: s.price,
				quantity: s.quantity,
				unit: s.unit,
				waste_type: s.waste_type,
				sub_items: s.sub_items,
				observations: s.observations ?? null,
			})),
		});
	};

	const onSubmit = async (data: ServiceFormValues) => {
		const existing = (services ?? []).map(s => ({
			name: s.name,
			description: s.description ?? null,
			price: s.price,
			quantity: s.quantity,
			unit: s.unit,
			waste_type: s.waste_type,
			sub_items: s.sub_items,
			observations: s.observations ?? null,
		}));

		try {
			await saveServices({
				services: [
					...existing,
					{
						name: data.name.trim(),
						description: data.description.trim() || null,
						price: data.price,
						quantity: data.quantity,
						unit: data.unit,
						waste_type: data.wasteType,
						sub_items: data.subItems.length > 0 ? data.subItems : null,
						observations: data.observations.trim() || null,
					},
				],
			});
			form.reset();
		} catch {
			// handled by context mutation's onError
		}
	};

	return (
		<>
			<Stack.Screen options={{ title: "Serviços" }} />
			<KeyboardAvoidingView
				className="flex-1"
				behavior={Platform.OS === "ios" ? "padding" : "height"}
			>
				<ScrollView
					className="flex-1 bg-white"
					contentContainerClassName="p-4 pb-8 gap-4"
				>
					<Card className="shadow-none gap-2">
						<Heading size="xl">Cadastro de serviços</Heading>
						<Text className="text-muted-foreground">
							Cadastre os serviços que sua empresa oferece e relacione-os aos
							resíduos aceitos para deixar a oferta mais clara para clientes.
						</Text>
					</Card>

					{isLoadingServices ? (
						<ServicesListSkeleton />
					) : services && services.length > 0 ? (
						<Card className="shadow-none gap-3">
							<Heading size="sm">Serviços cadastrados</Heading>
							{services.map(service => (
								<View
									key={service.id}
									className="flex-row items-center justify-between gap-3"
								>
									<View className="flex-1">
										<Text className="font-semibold">{service.name}</Text>
										<Text className="text-sm text-muted-foreground">
											R$ {service.price} / {service.unit}
										</Text>
									</View>
									<Pressable
										onPress={() => handleRemoveService(service.id)}
										disabled={isSavingServices}
										className="p-1"
									>
										<X size={18} className="text-muted-foreground" />
									</Pressable>
								</View>
							))}
						</Card>
					) : null}

					<Card className="shadow-none gap-4">
						<Heading size="sm">Informações principais</Heading>

						<FormControl isInvalid={!!formState.errors.name} className="gap-2">
							<FormControlLabel>
								<FormControlLabelText className="text-sm">
									Nome do serviço
								</FormControlLabelText>
							</FormControlLabel>
							<Controller
								control={control}
								name="name"
								render={({ field: { value, onChange, onBlur } }) => (
									<Input>
										<InputField
											value={value}
											onBlur={onBlur}
											onChangeText={onChange}
											placeholder="Ex.: Coleta de RCC"
											placeholderTextColor="#94a3b8"
										/>
									</Input>
								)}
							/>
							{formState.errors.name?.message ? (
								<FormControlError>
									<FormControlErrorIcon as={AlertCircle} />
									<FormControlErrorText>
										{formState.errors.name.message}
									</FormControlErrorText>
								</FormControlError>
							) : null}
						</FormControl>

						<FormControl
							isInvalid={!!formState.errors.description}
							className="gap-2"
						>
							<FormControlLabel>
								<FormControlLabelText className="text-sm">
									Descrição
								</FormControlLabelText>
							</FormControlLabel>
							<Controller
								control={control}
								name="description"
								render={({ field: { value, onChange, onBlur } }) => (
									<Input className="items-start min-h-24">
										<InputField
											value={value}
											onBlur={onBlur}
											onChangeText={onChange}
											placeholder="Descreva o serviço e o que ele cobre"
											placeholderTextColor="#94a3b8"
											multiline
											numberOfLines={4}
											textAlignVertical="top"
											className="h-24 py-3"
										/>
									</Input>
								)}
							/>
							{formState.errors.description?.message ? (
								<FormControlError>
									<FormControlErrorIcon as={AlertCircle} />
									<FormControlErrorText>
										{formState.errors.description.message}
									</FormControlErrorText>
								</FormControlError>
							) : null}
						</FormControl>

						<FormControl isInvalid={!!formState.errors.price} className="gap-2">
							<FormControlLabel>
								<FormControlLabelText className="text-sm">
									Preço
								</FormControlLabelText>
							</FormControlLabel>
							<Controller
								control={control}
								name="price"
								render={({ field: { value, onChange, onBlur } }) => (
									<DecimalInput mode="price">
										<DecimalInputSlot className="bg-accent p-1 rounded-md">
											<DecimalInputIcon as={DollarSignIcon} />
										</DecimalInputSlot>
										<DecimalInputField
											value={value}
											onChangeText={onChange}
											onBlur={onBlur}
											placeholder="0,00"
										/>
									</DecimalInput>
								)}
							/>
							<Text className="text-xs text-muted-foreground">
								Informe o valor cobrado pelo serviço.
							</Text>
							{formState.errors.price?.message ? (
								<FormControlError>
									<FormControlErrorIcon as={AlertCircle} />
									<FormControlErrorText>
										{formState.errors.price.message}
									</FormControlErrorText>
								</FormControlError>
							) : null}
						</FormControl>

						<HStack className="gap-2">
							<FormControl
								isInvalid={!!formState.errors.quantity}
								className="gap-2"
							>
								<FormControlLabel>
									<FormControlLabelText className="text-sm">
										Quantidade
									</FormControlLabelText>
								</FormControlLabel>
								<Controller
									control={control}
									name="quantity"
									render={({ field: { value, onChange, onBlur } }) => (
										<DecimalInput mode="decimal" className="h-10">
											<DecimalInputSlot className="bg-accent p-1 rounded-md">
												<DecimalInputIcon as={HashIcon} />
											</DecimalInputSlot>
											<DecimalInputField
												value={value}
												onChangeText={onChange}
												onBlur={onBlur}
												placeholder="1"
											/>
										</DecimalInput>
									)}
								/>
								<Text className="text-xs text-muted-foreground">
									Defina a quantidade padrão vinculada ao serviço.
								</Text>
								{formState.errors.quantity?.message ? (
									<FormControlError>
										<FormControlErrorIcon as={AlertCircle} />
										<FormControlErrorText>
											{formState.errors.quantity.message}
										</FormControlErrorText>
									</FormControlError>
								) : null}
							</FormControl>

							<FormControl className="flex-1 gap-2">
								<FormControlLabel>
									<FormControlLabelText className="text-sm">
										Unidade
									</FormControlLabelText>
								</FormControlLabel>
								<Controller
									control={control}
									name="unit"
									render={({ field: { value, onChange } }) => (
										<Select selectedValue={value} onValueChange={onChange}>
											<SelectTrigger>
												<SelectInput
													placeholder="Selecione a unidade"
													className="flex-1"
												/>
												<SelectIcon className="mr-3" as={ChevronDownIcon} />
											</SelectTrigger>
											<SelectPortal>
												<SelectBackdrop />
												<SelectContent>
													<SelectDragIndicatorWrapper>
														<SelectDragIndicator />
													</SelectDragIndicatorWrapper>
													<ScrollView className="w-full max-h-80">
														{measurements.length > 0 ? (
															measurements.map(measurement => (
																<SelectItem
																	key={measurement.value}
																	label={`${measurement.value} (${measurement.label})`}
																	value={measurement.value}
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
								{formState.errors.unit?.message ? (
									<FormControlError>
										<FormControlErrorText>
											{formState.errors.unit?.message}
										</FormControlErrorText>
									</FormControlError>
								) : null}
							</FormControl>
						</HStack>
						<FormControl
							isInvalid={!!formState.errors.observations}
							className="gap-2"
						>
							<FormControlLabel>
								<FormControlLabelText className="text-sm">
									Observações
								</FormControlLabelText>
							</FormControlLabel>
							<Controller
								control={control}
								name="observations"
								render={({ field: { value, onChange, onBlur } }) => (
									<Input className="items-start min-h-24">
										<InputField
											value={value}
											onBlur={onBlur}
											onChangeText={onChange}
											placeholder="Observações adicionais do serviço"
											placeholderTextColor="#94a3b8"
											multiline
											numberOfLines={4}
											textAlignVertical="top"
											className="h-24 py-3"
										/>
									</Input>
								)}
							/>
							{formState.errors.observations?.message ? (
								<FormControlError>
									<FormControlErrorIcon as={AlertCircle} />
									<FormControlErrorText>
										{formState.errors.observations.message}
									</FormControlErrorText>
								</FormControlError>
							) : null}
						</FormControl>

						<Heading size="sm">Unidade e categoria</Heading>
						<Text className="text-muted-foreground">
							O serviço pode ser vinculado a um tipo de resíduo para orientar a
							oferta de coleta.
						</Text>
						<View className="gap-2">
							<Text className="text-sm font-medium">Categoria de resíduo</Text>
							<Controller
								control={control}
								name="wasteType"
								render={({ field: { value, onChange } }) => (
									<View className="flex-row gap-2">
										{wasteTypes.map(wasteType => {
											const isSelected = wasteType.value === value;
											return (
												<Button
													key={wasteType.value}
													variant={isSelected ? "default" : "outline"}
													className="flex-1"
													onPress={() => onChange(wasteType.value)}
												>
													<ButtonText>{wasteType.label}</ButtonText>
												</Button>
											);
										})}
									</View>
								)}
							/>
						</View>

						<View className="gap-2">
							<Heading size="sm">Materiais vinculados</Heading>
							<Text className="text-muted-foreground">
								Adicione os materiais aceitos por este serviço. Eles ajudam a
								explicar o escopo da coleta.
							</Text>
						</View>

						<View className="flex-row items-end gap-2">
							<Input className="flex-1">
								<InputField
									value={subItemDraft}
									onChangeText={setSubItemDraft}
									placeholder="Ex.: concreto"
									placeholderTextColor="#94a3b8"
									returnKeyType="done"
									onSubmitEditing={onAddSubItem}
								/>
							</Input>
							<Button size="sm" onPress={onAddSubItem}>
								<ButtonText>Adicionar</ButtonText>
							</Button>
						</View>

						<View className="flex-row flex-wrap gap-2">
							{subItems.length > 0 ? (
								subItems.map(subItem => (
									<Pressable
										key={subItem}
										onPress={() => onRemoveSubItem(subItem)}
									>
										<Card
											size="sm"
											className="shadow-none flex-row items-center gap-2 border-border/80 bg-secondary/40"
										>
											<Text className="text-sm">{subItem}</Text>
											<X size={14} />
										</Card>
									</Pressable>
								))
							) : (
								<Text className="text-sm text-muted-foreground">
									Nenhum material adicionado ainda.
								</Text>
							)}
						</View>

						<View className="flex-row gap-2 mt-1">
							<Button
								variant="outline"
								className="flex-1"
								onPress={() => form.reset()}
								isDisabled={!formState.isDirty || isSavingServices}
							>
								<ButtonText>Cancelar</ButtonText>
							</Button>
							<Button
								className="flex-1"
								onPress={handleSubmit(onSubmit)}
								isDisabled={
									!formState.isValid ||
									formState.isSubmitting ||
									isSavingServices
								}
							>
								<ButtonText>Cadastrar</ButtonText>
								{isSavingServices && <ButtonIcon as={Spinner} />}
							</Button>
						</View>
					</Card>
				</ScrollView>
			</KeyboardAvoidingView>
		</>
	);
}
