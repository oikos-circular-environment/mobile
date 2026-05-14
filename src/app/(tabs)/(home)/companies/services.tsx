import { zodResolver } from "@hookform/resolvers/zod";
import { Stack } from "expo-router";
import { AlertCircle, X } from "lucide-react-native";
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
import { type Measurement, measurements } from "@/libs/types/measurement";
import type { Service } from "@/libs/types/service";
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

function parseQuantity(value: string) {
	const parsed = Number.parseInt(value, 10);

	return Number.isNaN(parsed) ? 0 : parsed;
}

export default function CompanyServicesScreen() {
	const [subItemDraft, setSubItemDraft] = useState("");

	const form = useForm<ServiceFormInput, undefined, ServiceFormValues>({
		resolver: zodResolver(serviceFormSchema),
		defaultValues: {
			name: "",
			description: "",
			price: 0,
			quantity: 1,
			unit: "KG",
			wasteType: "RECYCLABLE",
			subItems: [],
			observations: "",
		},
		mode: "onChange",
	});

	const { control, formState, getValues, handleSubmit, setValue, watch } = form;
	const subItems = watch("subItems") ?? [];
	const unit = watch("unit");
	const wasteType = watch("wasteType");

	const onAddSubItem = () => {
		const nextSubItem = subItemDraft.trim();

		if (!nextSubItem) {
			return;
		}

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
			{
				shouldDirty: true,
				shouldValidate: true,
			},
		);
	};

	const onSubmit = (data: ServiceFormValues) => {
		const payload: Service = {
			id: Date.now().toString(),
			name: data.name.trim(),
			description: data.description.trim() ? data.description.trim() : null,
			price: data.price,
			quantity: data.quantity,
			unit: data.unit,
			wasteType: data.wasteType,
			sub_items: data.subItems.length > 0 ? data.subItems : null,
			observations: data.observations.trim() ? data.observations.trim() : null,
		};

		console.log("Service payload:", payload);
		// TODO: Send to API
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
									<Input>
										<InputField
											value={String(value)}
											onBlur={onBlur}
											onChangeText={text => onChange(parseQuantity(text))}
											placeholder="1"
											placeholderTextColor="#94a3b8"
											keyboardType="number-pad"
										/>
									</Input>
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
					</Card>

					<Card className="shadow-none gap-3">
						<Heading size="sm">Unidade e categoria</Heading>
						<Text className="text-muted-foreground">
							O serviço pode ser vinculado a um tipo de resíduo para orientar a
							oferta de coleta.
						</Text>

						<View className="gap-3">
							<View className="gap-2">
								<Text className="text-sm font-medium">Unidade</Text>
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
							</View>

							<View className="gap-2">
								<Text className="text-sm font-medium">
									Categoria de resíduo
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
							</View>
						</View>

						<Text className="text-xs text-muted-foreground">
							Selecionado: {measurementLabelByValue[unit]} e{" "}
							{wasteTypeLabelByValue[wasteType]}.
						</Text>
					</Card>

					<Card className="shadow-none gap-4">
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
					</Card>

					<Button
						className="mt-1"
						onPress={handleSubmit(onSubmit)}
						isDisabled={!formState.isValid || formState.isSubmitting}
					>
						<ButtonText>Cadastrar serviço</ButtonText>
					</Button>
				</ScrollView>
			</KeyboardAvoidingView>
		</>
	);
}
