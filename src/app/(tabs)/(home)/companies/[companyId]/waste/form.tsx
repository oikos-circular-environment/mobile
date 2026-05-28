import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
	AlertCircle,
	ChevronDownIcon,
	DollarSignIcon,
	HashIcon,
	RecycleIcon,
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
	type WasteManagementFormInput,
	type WasteManagementFormValues,
	wasteManagementFormSchema,
} from "@/components/companies/waste/waste-form-schema";
import { colors } from "@/components/style/colors";
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

export default function WasteFormScreen() {
	const router = useRouter();
	const { id } = useLocalSearchParams<{ id: string }>();
	const { wastes, saveWastes, isSavingWastes } = useUserCompanyContext();
	const [subItemDraft, setSubItemDraft] = useState("");

	const initialData = id ? wastes?.find(w => w.id === id) : null;

	const form = useForm<
		WasteManagementFormInput,
		undefined,
		WasteManagementFormValues
	>({
		resolver: zodResolver(wasteManagementFormSchema),
		defaultValues: {
			name: initialData?.name ?? "",
			description: initialData?.description ?? "",
			price: initialData?.price ?? "0,00",
			quantity: initialData?.quantity ?? "1,00",
			unit: initialData?.unit ?? "KG",
			waste_type: initialData?.waste_type ?? "RECYCLABLE",
			subItems: initialData?.sub_items ?? [],
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

	const onSubmit = async (data: WasteManagementFormValues) => {
		let updatedWastes = [];
		const payload = {
			name: data.name.trim(),
			description: data.description.trim() || null,
			price: data.price,
			quantity: data.quantity,
			unit: data.unit,
			waste_type: data.waste_type,
			sub_items: data.subItems.length > 0 ? data.subItems : null,
		};

		if (initialData?.id) {
			updatedWastes = (wastes ?? []).map(w =>
				w.id === initialData.id
					? { ...w, ...payload }
					: {
							name: w.name,
							description: w.description ?? null,
							price: w.price,
							quantity: w.quantity,
							observations: w.observations,
							unit: w.unit,
							waste_type: w.waste_type,
							sub_items: w.sub_items,
						},
			);
		} else {
			const existing = (wastes ?? []).map(w => ({
				name: w.name,
				description: w.description ?? null,
				price: w.price,
				unit: w.unit,
				quantity: w.quantity,
				observations: w.observations,
				waste_type: w.waste_type,
				sub_items: w.sub_items,
			}));
			updatedWastes = [...existing, payload];
		}

		await saveWastes({ wastes: updatedWastes });
		router.back();
	};

	const handleRemove = async () => {
		if (!initialData?.id) return;
		const remaining = (wastes ?? []).filter(w => w.id !== initialData.id);
		try {
			await saveWastes({
				wastes: remaining.map(w => ({
					name: w.name,
					description: w.description ?? null,
					price: w.price,
					unit: w.unit,
					quantity: w.quantity,
					observations: w.observations,
					waste_type: w.waste_type,
					sub_items: w.sub_items,
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
				<Card className="bg-secondary shadow-none">
					<View className="flex-row items-center justify-between gap-4">
						<View className="size-15 items-center justify-center rounded-lg bg-primary">
							<RecycleIcon color={colors.white} size={20} />
						</View>
						<View className="flex-1 gap-1">
							<Heading className="text-lg">
								{initialData ? "Editar resíduo" : "Cadastro de resíduos"}
							</Heading>
							<Text className="text-sm ">
								{initialData
									? "Atualize as informações do resíduo coletado."
									: "Cadastre os resíduos que sua empresa coleta para vinculá-los ao seu perfil."}
							</Text>
						</View>
					</View>
				</Card>

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
									Quantidade base
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
															label={`${measurement.value} • ${measurement.label}`}
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

					<Heading size="sm">Categoria do resíduo</Heading>
					<Controller
						control={control}
						name="waste_type"
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

					<Heading size="sm">Materiais vinculados</Heading>
					<View className="flex-row items-end gap-2">
						<Input className="flex-1">
							<InputField
								value={subItemDraft}
								onChangeText={setSubItemDraft}
								placeholder="Ex.: garrafas PET"
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
							isDisabled={isSavingWastes}
						>
							<ButtonText>Cancelar</ButtonText>
						</Button>

						<Button
							className="flex-1"
							onPress={handleSubmit(onSubmit)}
							isDisabled={
								!formState.isValid || formState.isSubmitting || isSavingWastes
							}
						>
							<ButtonText>{initialData ? "Salvar" : "Cadastrar"}</ButtonText>
							{isSavingWastes && <ButtonIcon as={Spinner} />}
						</Button>
					</View>
				</Card>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}
