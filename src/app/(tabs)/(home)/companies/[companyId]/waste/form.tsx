import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
	AlertCircleIcon,
	ChevronDownIcon,
	DollarSignIcon,
	HashIcon,
	RecycleIcon,
} from "lucide-react-native";
import { Controller, useForm } from "react-hook-form";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useSaveWastes } from "@/components/companies/hooks/use-save-wastes";
import {
	type WasteManagementFormInput,
	type WasteManagementFormValues,
	wasteManagementFormSchema,
} from "@/components/companies/waste/waste-form-schema";
import {
	WasteCategory,
	WasteCategoryChip,
	WasteCategoryChips,
	WasteCategoryChipText,
	WasteCategoryContent,
} from "@/components/custom/waste-category";
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
import { VStack } from "@/components/ui/vstack";
import { measurements } from "@/libs/types/measurement";
import { cn } from "@/libs/utils";
import { useCompaniesStore } from "@/stores/companies-store";

export default function WasteFormScreen() {
	const router = useRouter();
	const { id, companyId } = useLocalSearchParams<{
		id: string;
		companyId: string;
	}>();
	const company = useCompaniesStore(s =>
		s.companies.find(c => c.id === companyId),
	);
	const wastes = company?.wastes;
	const { mutateAsync: saveWastes, isPending: isSavingWastes } =
		useSaveWastes(companyId);

	const initialData = id ? wastes?.find(w => w.id === id) : null;

	const form = useForm<
		WasteManagementFormInput,
		undefined,
		WasteManagementFormValues
	>({
		resolver: zodResolver(wasteManagementFormSchema),
		defaultValues: {
			waste_category_id: initialData?.waste_category_id ?? "",
			name: initialData?.name ?? "",
			description: initialData?.description ?? "",
			price: initialData?.price ?? "0,00",
			quantity: initialData?.quantity ?? "1,00",
			unit: initialData?.unit ?? "KG",
		},
		mode: "onChange",
	});

	const { control, formState, handleSubmit, setValue } = form;

	const onSubmit = async (data: WasteManagementFormValues) => {
		const payload = {
			name: data.name.trim(),
			description: data.description.trim() || null,
			price: data.price,
			quantity: data.quantity,
			unit: data.unit,
			waste_category_id: data.waste_category_id,
		};

		const mapExisting = (w: NonNullable<typeof wastes>[number]) => ({
			name: w.name,
			description: w.description ?? null,
			price: w.price,
			unit: w.unit,
			quantity: w.quantity,
			waste_category_id: w.waste_category_id,
		});

		const updatedWastes = initialData?.id
			? (wastes ?? []).map(w =>
					w.id === initialData.id ? { ...w, ...payload } : mapExisting(w),
				)
			: [...(wastes ?? []).map(mapExisting), payload];

		await saveWastes({ wastes: updatedWastes });
		router.back();
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
							<Text className="text-sm">
								{initialData
									? "Atualize as informações do resíduo coletado."
									: "Cadastre os resíduos que sua empresa coleta para vinculá-los ao seu perfil."}
							</Text>
						</View>
					</View>
				</Card>

				<VStack space="lg">
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
						{formState.errors.name?.message && (
							<FormControlError>
								<FormControlErrorIcon as={AlertCircleIcon} />
								<FormControlErrorText>
									{formState.errors.name.message}
								</FormControlErrorText>
							</FormControlError>
						)}
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
						{formState.errors.description?.message && (
							<FormControlError>
								<FormControlErrorIcon as={AlertCircleIcon} />
								<FormControlErrorText>
									{formState.errors.description.message}
								</FormControlErrorText>
							</FormControlError>
						)}
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
										<SelectTrigger
											className={cn(
												"justify-between",
												Platform.OS === "android" ? "px-3" : "pr-3",
											)}
										>
											<SelectInput placeholder="Selecione a unidade" />
											<SelectIcon as={ChevronDownIcon} />
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

					<VStack space="lg">
						<Heading size="sm">Categoria de resíduo</Heading>

						{formState.errors.waste_category_id && (
							<FormControl isInvalid>
								<FormControlError>
									<FormControlErrorIcon as={AlertCircleIcon} />
									<FormControlErrorText>
										{formState.errors.waste_category_id.message}
									</FormControlErrorText>
								</FormControlError>
							</FormControl>
						)}

						<WasteCategory
							defaultCategoryId={initialData?.waste_category_id}
							onSelectionChange={cat =>
								setValue("waste_category_id", cat.id, {
									shouldValidate: true,
									shouldDirty: true,
								})
							}
						>
							<ScrollView
								horizontal
								showsHorizontalScrollIndicator={false}
								contentContainerClassName="gap-2 py-0.5"
							>
								<WasteCategoryChips>
									{category => (
										<WasteCategoryChip key={category.id} category={category}>
											<WasteCategoryChipText>
												{category.name}
											</WasteCategoryChipText>
										</WasteCategoryChip>
									)}
								</WasteCategoryChips>
							</ScrollView>
							<WasteCategoryContent />
						</WasteCategory>
					</VStack>

					<View className="flex-row gap-2 mt-4">
						<Button
							testID="btn-cancel"
							variant="outline"
							className="flex-1"
							onPress={() => router.back()}
							isDisabled={isSavingWastes}
						>
							<ButtonText>Cancelar</ButtonText>
						</Button>

						<Button
							testID="btn-submit"
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
				</VStack>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}
