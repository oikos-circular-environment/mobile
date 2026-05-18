import { zodResolver } from "@hookform/resolvers/zod";
import { Stack } from "expo-router";
import { AlertCircle, X } from "lucide-react-native";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	View,
} from "react-native";
import {
	type WasteManagementFormInput,
	type WasteManagementFormValues,
	wasteManagementFormSchema,
} from "@/components/companies/waste/waste-form-schema";
import { Button, ButtonText } from "@/components/ui/button";
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
import { Input, InputField } from "@/components/ui/input";
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

function parsePrice(value: string) {
	const normalized = value.replace(",", ".");
	const parsed = Number(normalized);
	return Number.isNaN(parsed) ? 0 : parsed;
}

export default function CompanyWasteManagementScreen() {
	const { wastes, isLoadingWastes, saveWastes, isSavingWastes } =
		useUserCompanyContext();

	const [subItemDraft, setSubItemDraft] = useState("");

	const form = useForm<WasteManagementFormInput, undefined, WasteManagementFormValues>({
		resolver: zodResolver(wasteManagementFormSchema),
		defaultValues: {
			name: "",
			description: "",
			price: 0,
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
						<View className="items-center py-4">
							<ActivityIndicator size="small" />
						</View>
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
									Preço por unidade
								</FormControlLabelText>
							</FormControlLabel>
							<Controller
								control={control}
								name="price"
								render={({ field: { value, onChange, onBlur } }) => (
									<Input>
										<InputField
											value={String(value)}
											onBlur={onBlur}
											onChangeText={text => onChange(parsePrice(text))}
											placeholder="0,00"
											placeholderTextColor="#94a3b8"
											keyboardType="decimal-pad"
										/>
									</Input>
								)}
							/>
							<Text className="text-xs text-muted-foreground">
								Preencha com o valor cobrado para o resíduo selecionado.
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
					</Card>

					<Card className="shadow-none gap-3">
						<Heading size="sm">Unidade de medida</Heading>
						<Text className="text-muted-foreground">
							Escolha a unidade usada para cobrança e controle:{" "}
							{measurementLabelByValue[unit]}.
						</Text>

						<Controller
							control={control}
							name="unit"
							render={({ field: { value, onChange } }) => (
								<View className="flex-row flex-wrap gap-2">
									{measurements.map(measurement => {
										const isSelected = measurement.value === value;
										return (
											<Button
												key={measurement.value}
												variant={isSelected ? "secondary" : "outline"}
												size="sm"
												className="min-w-24"
												onPress={() => onChange(measurement.value)}
											>
												<ButtonText>{measurement.label}</ButtonText>
											</Button>
										);
									})}
								</View>
							)}
						/>
					</Card>

					<Card className="shadow-none gap-3">
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
												variant={isSelected ? "secondary" : "outline"}
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

						<Text className="text-xs text-muted-foreground">
							Selecionado: {wasteTypeLabelByValue[wasteType]}.
						</Text>
					</Card>

					<Card className="shadow-none gap-4">
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

					<Button
						className="mt-1"
						onPress={handleSubmit(onSubmit)}
						isDisabled={
							!formState.isValid || formState.isSubmitting || isSavingWastes
						}
					>
						<ButtonText>Cadastrar resíduo</ButtonText>
					</Button>
				</ScrollView>
			</KeyboardAvoidingView>
		</>
	);
}
