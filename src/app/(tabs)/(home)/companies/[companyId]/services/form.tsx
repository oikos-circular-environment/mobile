import { zodResolver } from "@hookform/resolvers/zod";

import { useLocalSearchParams, useRouter } from "expo-router";
import {
	AlertCircleIcon,
	ChevronDownIcon,
	ChevronsUpIcon,
	ChevronUpIcon,
	CircleAlertIcon,
	DollarSignIcon,
	HashIcon,
	InfoIcon,
	MinusIcon,
	WrenchIcon,
} from "lucide-react-native";
import { Controller, useForm } from "react-hook-form";
import {
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	View,
} from "react-native";
import { useSaveServices } from "@/components/companies/hooks/use-save-services";
import { useWasteCategories } from "@/components/companies/hooks/use-waste-categories";
import {
	type ServiceFormInput,
	type ServiceFormValues,
	serviceFormSchema,
} from "@/components/companies/services/services-form-schema";
import { colors } from "@/components/style/colors";
import { Alert, AlertIcon, AlertText } from "@/components/ui/alert";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { Box } from "@/components/ui/box";
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

export default function ServiceFormScreen() {
	const router = useRouter();
	const { id, companyId } = useLocalSearchParams<{
		id: string;
		companyId: string;
	}>();
	const company = useCompaniesStore(s =>
		s.companies.find(c => c.id === companyId),
	);
	const services = company?.services;
	const { mutateAsync: saveServices, isPending: isSavingServices } =
		useSaveServices(companyId);

	const initialData = id ? services?.find(s => s.id === id) : null;

	const { categories, isLoading: isLoadingCategories } = useWasteCategories();

	const form = useForm<ServiceFormInput, undefined, ServiceFormValues>({
		resolver: zodResolver(serviceFormSchema),
		defaultValues: {
			waste_category_id: initialData?.waste_category_id ?? "",
			name: initialData?.name ?? "",
			description: initialData?.description ?? "",
			price: initialData?.price ?? "0,00",
			quantity: initialData?.quantity ?? "1,00",
			unit: initialData?.unit ?? "KG",
			observations: initialData?.observations ?? "",
		},
		mode: "onChange",
	});

	const { control, formState, handleSubmit, setValue, watch } = form;
	const wasteCategoryId = watch("waste_category_id");
	const selectedCategory = categories.find(c => c.id === wasteCategoryId);

	if (!selectedCategory && categories.length > 0) {
		setValue("waste_category_id", categories[0].id);
	}

	const onSubmit = async (data: ServiceFormValues) => {
		const payload = {
			name: data.name.trim(),
			description: data.description.trim() || null,
			price: data.price,
			quantity: data.quantity,
			unit: data.unit,
			waste_category_id: data.waste_category_id,
			observations: data.observations.trim() || null,
		};

		const mapExisting = (s: NonNullable<typeof services>[number]) => ({
			name: s.name,
			description: s.description ?? null,
			price: s.price,
			quantity: s.quantity,
			unit: s.unit,
			waste_category_id: s.waste_category_id,
			observations: s.observations ?? null,
		});

		const updatedServices = initialData?.id
			? (services ?? []).map(s =>
					s.id === initialData.id ? { ...s, ...payload } : mapExisting(s),
				)
			: [...(services ?? []).map(mapExisting), payload];

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
		await saveServices({
			services: remaining.map(s => ({
				name: s.name,
				description: s.description ?? null,
				price: s.price,
				quantity: s.quantity,
				unit: s.unit,
				waste_category_id: s.waste_category_id,
				observations: s.observations ?? null,
			})),
		});
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
							<WrenchIcon color={colors.white} size={20} />
						</View>
						<View className="flex-1 gap-1">
							<Heading className="text-lg">
								{initialData ? "Editar serviço" : "Cadastro de serviços"}
							</Heading>
							<Text className="text-sm">
								{initialData
									? "Atualize as informações do seu serviço."
									: "Cadastre os serviços que sua empresa oferece e relacione-os aos resíduos aceitos."}
							</Text>
						</View>
					</View>
				</Card>

				<VStack space="lg">
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
										placeholder="Descreva o serviço e o que ele cobre"
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
										<SelectTrigger
											size="sm"
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
										multiline
										numberOfLines={4}
										textAlignVertical="top"
										className="h-24 py-3"
									/>
								</Input>
							)}
						/>
					</FormControl>

					<VStack space="lg">
						<Heading size="sm">Categoria de resíduo</Heading>

						{isLoadingCategories ? (
							<View className="flex-row gap-2">
								{[1, 2, 3, 4].map(i => (
									<View
										key={i}
										className="h-9 w-24 rounded-xl bg-secondary/60"
									/>
								))}
							</View>
						) : (
							<ScrollView
								horizontal
								showsHorizontalScrollIndicator={false}
								contentContainerClassName="gap-2 py-0.5"
							>
								{categories.map(category => {
									const isSelected = category.id === wasteCategoryId;
									return (
										<Pressable
											key={category.id}
											onPress={() =>
												setValue("waste_category_id", category.id, {
													shouldValidate: true,
													shouldDirty: true,
												})
											}
										>
											<View
												className={cn(
													"px-4 py-2 rounded-xl border",
													isSelected
														? "bg-lime-800 border-lime-800"
														: "bg-white border-border",
												)}
											>
												<Text
													className={cn(
														"text-sm font-medium",
														isSelected && "text-white",
													)}
												>
													{category.name}
												</Text>
											</View>
										</Pressable>
									);
								})}
							</ScrollView>
						)}

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

						<VStack space="md">
							<Card className="shadow-none gap-2">
								<Text size="sm" className="font-semibold text-muted-foreground">
									Grau de periculosidade geral
								</Text>
								<HStack className="gap-2">
									{selectedCategory?.hazard_levels.map(hazard_level => (
										<WasteCategoryHazardLevel
											key={`${selectedCategory.id}-${hazard_level}`}
											harzardLevel={hazard_level}
										/>
									))}
									<Text className="text-sm text-muted-foreground"></Text>
								</HStack>
							</Card>

							{selectedCategory?.description && (
								<Alert className="gap-2 bg-sky-100 border-sky-400">
									<AlertIcon as={InfoIcon} className="text-sky-400" />
									<AlertText className="text-foreground/80">
										{selectedCategory.description}
									</AlertText>
								</Alert>
							)}

							{selectedCategory?.observations && (
								<Alert className="gap-2 bg-destructive/10 border-destructive/20">
									<AlertIcon
										as={CircleAlertIcon}
										className="text-destructive/40"
									/>
									<AlertText className="flex-col text-foreground/80">
										{selectedCategory.observations}
									</AlertText>
								</Alert>
							)}

							<Text size="sm" className="font-semibold text-muted-foreground">
								Itens relacinados
							</Text>
							{selectedCategory?.subcategories.map(subItem => (
								<Card key={subItem.id} className="shadow-none gap-2">
									<HStack space="md" className="items-center">
										<WasteCategoryHazardLevel
											harzardLevel={subItem.hazard_level}
										/>
										<Box className="flex-1">
											<Text numberOfLines={2}>{subItem.name}</Text>
										</Box>
									</HStack>
									{subItem.observations && (
										<Alert className="p-1 gap-2 bg-destructive/10 border-destructive/20 items-center">
											<AlertIcon
												as={CircleAlertIcon}
												size={14}
												className="text-destructive/40"
											/>
											<AlertText className="flex-col text-foreground/80">
												{subItem.observations}
											</AlertText>
										</Alert>
									)}
								</Card>
							))}
						</VStack>
					</VStack>

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
				</VStack>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

interface WasteCategoryHazardLevelProps {
	harzardLevel: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
}
export function WasteCategoryHazardLevel({
	harzardLevel,
}: WasteCategoryHazardLevelProps) {
	switch (harzardLevel) {
		case "LOW":
			return (
				<Badge
					variant="secondary"
					className="gap-1 bg-lime-50 border border-lime-200"
				>
					<BadgeIcon as={ChevronDownIcon} className="text-lime-600 stroke-3" />
					<BadgeText className="text-lime-600 font-semibold">Baixa</BadgeText>
				</Badge>
			);
		case "MEDIUM":
			return (
				<Badge
					variant="secondary"
					className="gap-1 bg-yellow-50 border border-yellow-200"
				>
					<BadgeIcon as={MinusIcon} className="text-yellow-600 stroke-3" />
					<BadgeText className="text-yellow-600 font-semibold">Média</BadgeText>
				</Badge>
			);
		case "HIGH":
			return (
				<Badge
					variant="secondary"
					className="gap-1 bg-orange-50 border border-orange-200"
				>
					<BadgeIcon as={ChevronUpIcon} className="text-orange-600 stroke-3" />
					<BadgeText className="text-orange-600 font-semibold">Alta</BadgeText>
				</Badge>
			);
		case "VERY_HIGH":
			return (
				<Badge
					variant="secondary"
					className="gap-1 bg-red-50 border border-red-200"
				>
					<BadgeIcon as={ChevronsUpIcon} className="text-red-600 stroke-3" />
					<BadgeText className="text-red-600 font-semibold">
						Muito alta
					</BadgeText>
				</Badge>
			);
		default:
			return (
				<Badge variant="secondary">
					<BadgeText>Desconhecido</BadgeText>
				</Badge>
			);
	}
}
