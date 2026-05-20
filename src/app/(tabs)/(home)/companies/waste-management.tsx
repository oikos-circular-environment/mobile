import { zodResolver } from "@hookform/resolvers/zod";
import { Stack } from "expo-router";
import { AlertCircle, DollarSignIcon, HashIcon, X } from "lucide-react-native";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	View,
} from "react-native";
import { WasteListSkeleton } from "@/components/companies/skeletons";
import {
	type WasteManagementFormInput,
	type WasteManagementFormValues,
	wasteManagementFormSchema,
} from "@/components/companies/waste/waste-form-schema";
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
import { ChevronDownIcon } from "@/components/ui/icon";
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
import { type Measurement, measurements } from "@/libs/types/measurement";
import { type WasteType, wasteTypes } from "@/libs/types/waste";

const measurementLabelByValue = Object.fromEntries(
	measurements.map(measurement => [measurement.value, measurement.label]),
) as Record<Measurement, string>;

const wasteTypeLabelByValue = Object.fromEntries(
	wasteTypes.map(wasteType => [wasteType.value, wasteType.label]),
) as Record<WasteType, string>;

export default function CompanyWasteManagementScreen() {
	const { wastes, isLoadingWastes, saveWastes, isSavingWastes } =
		useUserCompanyContext();

	const [subItemDraft, setSubItemDraft] = useState("");

	const form = useForm<
		WasteManagementFormInput,
		undefined,
		WasteManagementFormValues
	>({
		resolver: zodResolver(wasteManagementFormSchema),
		defaultValues: {
			name: "",
			description: "",
			price: "0,00",
			quantity: "1,00",
			unit: "KG",
			wasteType: "RECYCLABLE",
			subItems: [],
		},
		mode: "onChange",
	});

	const { control, formState, getValues, handleSubmit, setValue, watch } = form;
	const subItems = watch("subItems") ?? [];
	const unit = watch("unit");
	const wasteType = watch("wasteType");

	const onAddSubItem = () => {
		const draft = subItemDraft.trim();
		if (!draft) return;

		const newItems = draft
			.split(",")
			.map(item => item.trim())
			.filter(item => item !== "");

		if (newItems.length === 0) return;

		const currentSubItems = getValues("subItems") ?? [];
		const uniqueNewItems = newItems.filter(
			item => !currentSubItems.includes(item),
		);

		if (uniqueNewItems.length > 0) {
			setValue("subItems", [...currentSubItems, ...uniqueNewItems], {
				shouldDirty: true,
				shouldValidate: true,
			});
		}

		setSubItemDraft("");
	};

	const onRemoveSubItem = (subItem: string) => {
		setValue(
			"subItems",
			(getValues("subItems") ?? []).filter(item => item !== subItem),
			{ shouldDirty: true, shouldValidate: true },
		);
	};

	const handleRemoveWaste = async (wasteId: string) => {
		const remaining = (wastes ?? []).filter(w => w.id !== wasteId);
		try {
			await saveWastes({
				wastes: remaining.map(w => ({
					name: w.name,
					description: w.description ?? null,
					price: w.price,
					unit: w.unit,
					waste_type: w.waste_type,
					sub_items: w.sub_items,
				})),
			});
		} catch {
			// handled by context mutation's onError
		}
	};

	const onSubmit = async (data: WasteManagementFormValues) => {
		const existing = (wastes ?? []).map(w => ({
			name: w.name,
			description: w.description ?? null,
			price: w.price,
			unit: w.unit,
			waste_type: w.waste_type,
			sub_items: w.sub_items,
		}));

		try {
			await saveWastes({
				wastes: [
					...existing,
					{
						name: data.name.trim(),
						description: data.description.trim() || null,
						price: data.price,
						unit: data.unit,
						waste_type: data.wasteType,
						sub_items: data.subItems.length > 0 ? data.subItems : null,
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
			<Stack.Screen options={{ title: "Gestão de resíduos" }} />
			<KeyboardAvoidingView
				className="flex-1"
				behavior={Platform.OS === "ios" ? "padding" : "height"}
			>
				<ScrollView
					className="flex-1 bg-white"
					contentContainerClassName="p-4 pb-8 gap-4"
				>
					<Card className="shadow-none gap-2">
						<Heading size="xl">Cadastro de resíduos</Heading>
						<Text className="text-muted-foreground">
							Cadastre os resíduos que sua empresa coleta para vinculá-los ao
							seu perfil e facilitar o entendimento dos materiais aceitos.
						</Text>
					</Card>

					{isLoadingWastes ? (
						<WasteListSkeleton />
					) : wastes && wastes.length > 0 ? (
						<Card className="shadow-none gap-3">
							<Heading size="sm">Resíduos cadastrados</Heading>
							{wastes.map(waste => (
								<View
									key={waste.id}
									className="flex-row items-center justify-between gap-3"
								>
									<View className="flex-1">
										<Text className="font-semibold">{waste.name}</Text>
										<Text className="text-sm text-muted-foreground">
											R$ {waste.price} / {waste.unit}
										</Text>
									</View>
									<Pressable
										onPress={() => handleRemoveWaste(waste.id)}
										disabled={isSavingWastes}
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
									Nome do resíduo
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
											placeholder="Ex.: Plástico"
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
											placeholder="Explique como esse resíduo é coletado ou separado"
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

						<Heading size="sm">Categoria do resíduo</Heading>
						<Text className="text-muted-foreground">
							Vincule o cadastro à categoria que representa o tipo de coleta.
						</Text>

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
												className="flex-1 will-change-variable"
												onPress={() => onChange(wasteType.value)}
											>
												<ButtonText>{wasteType.label}</ButtonText>
											</Button>
										);
									})}
								</View>
							)}
						/>

						<Text className="text-xs text-muted-foreground">
							Selecionado: {wasteTypeLabelByValue[wasteType]}.
						</Text>

						<View className="gap-2">
							<Heading size="sm">Materiais vinculados</Heading>
							<Text className="text-muted-foreground">
								Liste os materiais que este resíduo cobre. Você pode adicionar
								vários itens, como garrafas, sacolas ou embalagens.
							</Text>
						</View>

						<View className="flex-row items-end gap-2">
							<Input className="flex-1">
								<InputField
									value={subItemDraft}
									onChangeText={setSubItemDraft}
									placeholder="Ex.: garrafas PET"
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
					</Card>

					<View className="flex-row gap-2 mt-1">
						<Button
							variant="outline"
							className="flex-1 will-change-variable"
							onPress={() => form.reset()}
							isDisabled={!formState.isDirty || isSavingWastes}
						>
							<ButtonText>Limpar</ButtonText>
						</Button>
						<Button
							className="flex-1 will-change-variable"
							onPress={handleSubmit(onSubmit)}
							isDisabled={
								!formState.isValid || formState.isSubmitting || isSavingWastes
							}
						>
							<ButtonText>Cadastrar</ButtonText>
							{isSavingWastes && <ButtonIcon as={Spinner} />}
						</Button>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</>
	);
}
