import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { waste_types } from "@/libs/types/waste";

export default function ServiceFormScreen() {
	const router = useRouter();
	const { id } = useLocalSearchParams<{ id: string }>();
	const { services, saveServices, isSavingServices } = useUserCompanyContext();
	const [subItemDraft, setSubItemDraft] = useState("");

	const initialData = id ? services?.find(s => s.id === id) : null;

	const form = useForm<ServiceFormInput, undefined, ServiceFormValues>({
		resolver: zodResolver(serviceFormSchema),
		defaultValues: {
			name: initialData?.name ?? "",
			description: initialData?.description ?? "",
			price: initialData?.price ?? "0,00",
			quantity: initialData?.quantity ?? "1,00",
			unit: initialData?.unit ?? "KG",
			waste_type: initialData?.waste_type ?? "RECYCLABLE",
			subItems: initialData?.sub_items ?? [],
			observations: initialData?.observations ?? "",
		},
		mode: "onChange",
	});

	const { control, formState, getValues, handleSubmit, setValue, watch } = form;
	const subItems = watch("subItems") ?? [];

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

	const onSubmit = async (data: ServiceFormValues) => {
		let updatedServices = [];
		const payload = {
			name: data.name.trim(),
			description: data.description.trim() || null,
			price: data.price,
			quantity: data.quantity,
			unit: data.unit,
			waste_type: data.waste_type,
			sub_items: data.subItems.length > 0 ? data.subItems : null,
			observations: data.observations.trim() || null,
		};

		if (initialData?.id) {
			updatedServices = (services ?? []).map(s =>
				s.id === initialData.id
					? { ...s, ...payload }
					: {
							name: s.name,
							description: s.description ?? null,
							price: s.price,
							quantity: s.quantity,
							unit: s.unit,
							waste_type: s.waste_type,
							sub_items: s.sub_items,
							observations: s.observations ?? null,
						},
			);
		} else {
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
			updatedServices = [...existing, payload];
		}

		try {
			await saveServices({ services: updatedServices });
			router.back();
		} catch {
			// handled by context mutation's onError
		}
	};

	const handleRemove = async () => {
		if (!initialData?.id) return;
		const remaining = (services ?? []).filter(s => s.id !== initialData.id);
		try {
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
			router.back();
		} catch {
			// handled by context mutation's onError
		}
	};

	return (
		<KeyboardAvoidingView
			className="flex-1"
			behavior={Platform.OS === "ios" ? "padding" : "height"}
		>
			<ScrollView
				className="flex-1 bg-white"
				contentContainerClassName="p-4 pb-8 gap-4"
			>
				<Card className="shadow-none gap-2">
					<Heading size="xl">
						{initialData ? "Editar serviço" : "Cadastro de serviços"}
					</Heading>
					<Text className="text-muted-foreground">
						{initialData
							? "Atualize as informações do seu serviço."
							: "Cadastre os serviços que sua empresa oferece e relacione-os aos resíduos aceitos."}
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
					</FormControl>

					<HStack className="gap-2">
						<FormControl
							isInvalid={!!formState.errors.quantity}
							className="flex-1 gap-2"
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
						</FormControl>

						<FormControl className="gap-2">
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
											<SelectInput placeholder="Selecione a unidade" />
											<SelectIcon className="mr-3" as={ChevronDownIcon} />
										</SelectTrigger>
										<SelectPortal>
											<SelectBackdrop />
											<SelectContent>
												<SelectDragIndicatorWrapper>
													<SelectDragIndicator />
												</SelectDragIndicatorWrapper>
												<ScrollView className="w-full max-h-80">
													{measurements.map(measurement => (
														<SelectItem
															key={measurement.value}
															label={`${measurement.value} (${measurement.label})`}
															value={measurement.value}
														/>
													))}
												</ScrollView>
											</SelectContent>
										</SelectPortal>
									</Select>
								)}
							/>
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
					</FormControl>

					<Heading size="sm">Categoria de resíduo</Heading>
					<Controller
						control={control}
						name="waste_type"
						render={({ field: { value, onChange } }) => (
							<View className="flex-row gap-2">
								{waste_types.map(waste_type => {
									const isSelected = waste_type.value === value;
									return (
										<Button
											key={waste_type.value}
											variant={isSelected ? "default" : "outline"}
											className="flex-1 will-change-variable"
											onPress={() => onChange(waste_type.value)}
										>
											<ButtonText>{waste_type.label}</ButtonText>
										</Button>
									);
								})}
							</View>
						)}
					/>

					<Heading size="sm">Materiais vinculados</Heading>
					<View className="flex-row items-end gap-2">
						<Input className="flex-1">
							<InputField
								value={subItemDraft}
								onChangeText={setSubItemDraft}
								placeholder="Ex.: concreto, madeira, gesso"
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

					<View className="flex-row gap-2 mt-4">
						<Button
							variant="outline"
							className="flex-1"
							onPress={() => router.back()}
							isDisabled={isSavingServices}
						>
							<ButtonText>Cancelar</ButtonText>
						</Button>
						{initialData && (
							<Button
								variant="outline"
								className="flex-1 border-error-300"
								onPress={handleRemove}
								isDisabled={isSavingServices}
							>
								<ButtonText className="text-error-600">Excluir</ButtonText>
							</Button>
						)}
						<Button
							className="flex-1"
							onPress={handleSubmit(onSubmit)}
							isDisabled={
								!formState.isValid || formState.isSubmitting || isSavingServices
							}
						>
							<ButtonText>{initialData ? "Salvar" : "Cadastrar"}</ButtonText>
							{isSavingServices && <ButtonIcon as={Spinner} />}
						</Button>
					</View>
				</Card>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}
