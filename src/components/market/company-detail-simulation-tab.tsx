import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircleIcon, Calculator, Trash2 } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import type { SharedValue } from "react-native-reanimated";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { z } from "zod";
import { colors } from "@/components/style/colors";
import { toast } from "@/components/toast";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DecimalInput, DecimalInputField } from "@/components/ui/decimal-input";
import {
	FormControl,
	FormControlError,
	FormControlErrorIcon,
	FormControlErrorText,
} from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { Input, InputField } from "@/components/ui/input";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { useCompanyDetail } from "@/contexts/company-detail-context";
import {
	getMarketCheckoutDraft,
	type MarketCheckoutItemDraft,
	type MarketSimulationItemType,
} from "@/libs/memory/market-simulations";
import { HStack } from "../ui/hstack";
import { VStack } from "../ui/vstack";

type SimulationSelection = {
	itemType: MarketSimulationItemType;
	itemId: string;
};

type CompanyDetailSimulationTabProps = {
	selectedItem: SimulationSelection | null;
};

const measurementSymbol: Record<string, string> = {
	KG: "kg",
	L: "L",
	UNIT: "un",
	M: "m",
	M2: "m²",
	M3: "m³",
	ML: "ml",
};

const formatCurrency = (value: number) =>
	new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
		minimumFractionDigits: 2,
	}).format(value);

const parseNumber = (rawValue: string) => {
	const normalized = rawValue.replace(",", ".").trim();
	const value = Number(normalized);
	if (Number.isNaN(value) || value < 0) return 0;
	return value;
};

const SWIPE_ACTION_WIDTH = 72;

function SwipeDeleteAction({
	translation,
	onDelete,
}: {
	translation: SharedValue<number>;
	onDelete: () => void;
}) {
	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: translation.value + SWIPE_ACTION_WIDTH }],
	}));

	return (
		<Animated.View
			style={[animatedStyle, { width: SWIPE_ACTION_WIDTH }]}
			className="overflow-hidden rounded-r-lg"
		>
			<Pressable
				className="flex-1 items-center justify-center gap-1 bg-red-500"
				onPress={onDelete}
			>
				<Trash2 size={16} color={colors.white} />
				<Text className="text-[10px] font-semibold text-white">Remover</Text>
			</Pressable>
		</Animated.View>
	);
}

const simulationSchema = z.object({
	quantity: z
		.string()
		.refine(
			val => parseNumber(val) > 0,
			"Informe uma quantidade maior que zero.",
		),
});

type SimulationFormValues = z.infer<typeof simulationSchema>;

export function CompanyDetailSimulationTab({
	selectedItem,
}: CompanyDetailSimulationTabProps) {
	const { company } = useCompanyDetail();
	const [activeItemType, setActiveItemType] =
		useState<MarketSimulationItemType>(selectedItem?.itemType ?? "waste");
	const [selectedCatalogItemId, setSelectedCatalogItemId] = useState(
		selectedItem?.itemId ?? "",
	);
	const [checkoutItems, setCheckoutItems] = useState<MarketCheckoutItemDraft[]>(
		[],
	);

	const {
		control,
		handleSubmit,
		reset,
		watch,
		formState: { errors },
	} = useForm<SimulationFormValues>({
		resolver: zodResolver(simulationSchema),
		defaultValues: { quantity: "1" },
	});

	const watchedQuantity = watch("quantity");

	const catalogItems = useMemo(() => {
		if (activeItemType === "waste") return company.wastes ?? [];
		return company.services ?? [];
	}, [activeItemType, company.services, company.wastes]);

	const selectedCatalogItem = useMemo(() => {
		if (!selectedCatalogItemId) return catalogItems[0] ?? null;
		return catalogItems.find(item => item.id === selectedCatalogItemId) ?? null;
	}, [catalogItems, selectedCatalogItemId]);

	useEffect(() => {
		const draft = getMarketCheckoutDraft(company.id);
		setCheckoutItems(draft?.items ?? []);
	}, [company.id]);

	useEffect(() => {
		if (!selectedItem) return;
		setActiveItemType(selectedItem.itemType);
		setSelectedCatalogItemId(selectedItem.itemId);
	}, [selectedItem]);

	useEffect(() => {
		if (!catalogItems.length) {
			setSelectedCatalogItemId("");
			return;
		}
		if (catalogItems.some(item => item.id === selectedCatalogItemId)) return;
		setSelectedCatalogItemId(catalogItems[0].id);
	}, [catalogItems, selectedCatalogItemId]);

	const parsedQuantity = parseNumber(watchedQuantity ?? "");
	const unitPrice = selectedCatalogItem?.price ?? 0;
	const total = parsedQuantity * unitPrice;
	const orderTotal = checkoutItems.reduce((acc, item) => acc + item.total, 0);

	const onSubmit = (data: SimulationFormValues) => {
		if (!selectedCatalogItem) return;

		const qty = parseNumber(data.quantity);
		const itemTotal = qty * unitPrice;

		const nextItems = [...checkoutItems];
		const existingIndex = nextItems.findIndex(
			item =>
				item.itemId === selectedCatalogItem.id &&
				item.itemType === activeItemType,
		);

		const nextItem: MarketCheckoutItemDraft = {
			itemId: selectedCatalogItem.id,
			itemType: activeItemType,
			itemName: selectedCatalogItem.name,
			unit:
				measurementSymbol[selectedCatalogItem.unit] ?? selectedCatalogItem.unit,
			unitPrice,
			quantity: qty,
			note: "",
			total: itemTotal,
		};

		if (existingIndex >= 0) {
			const existing = nextItems[existingIndex];
			const accumulatedQty = existing.quantity + qty;
			nextItems[existingIndex] = {
				...existing,
				quantity: accumulatedQty,
				total: accumulatedQty * unitPrice,
			};
			toast.success("Quantidade atualizada na simulação.");
		} else {
			nextItems.push(nextItem);
			toast.success("Item adicionado à simulação.");
		}

		setCheckoutItems(nextItems);
		reset({ quantity: "1" });
	};

	return (
		<View className="gap-4">
			<Card className="gap-3 rounded-lg border-gray-200 p-3 shadow-none">
				<View>
					<Heading size="md" className="text-base text-gray-950">
						Simulação
					</Heading>
					<Text className="text-sm text-gray-500">
						Selecione os itens e quantidades para montar sua simulação.
					</Text>
				</View>

				<View className="flex-row gap-2">
					<Pressable
						className={`flex-1 items-center rounded-md px-3 py-2 ${activeItemType === "waste" ? "bg-lime-800" : "bg-gray-100"}`}
						onPress={() => setActiveItemType("waste")}
					>
						<Text
							className={`text-xs font-semibold ${activeItemType === "waste" ? "text-white" : "text-gray-700"}`}
						>
							Resíduos
						</Text>
					</Pressable>
					<Pressable
						className={`flex-1 items-center rounded-md px-3 py-2 ${activeItemType === "service" ? "bg-lime-800" : "bg-gray-100"}`}
						onPress={() => setActiveItemType("service")}
					>
						<Text
							className={`text-xs font-semibold ${activeItemType === "service" ? "text-white" : "text-gray-700"}`}
						>
							Serviços
						</Text>
					</Pressable>
				</View>

				<View className="gap-2">
					{catalogItems.length ? (
						catalogItems.map(item => {
							const isSelected = item.id === selectedCatalogItem?.id;
							return (
								<Pressable
									key={item.id}
									className={`rounded-md border px-3 py-2 ${isSelected ? "border-lime-800 bg-lime-800/5" : "border-gray-200 bg-white"}`}
									onPress={() => setSelectedCatalogItemId(item.id)}
								>
									<View className="flex-row items-center justify-between gap-2">
										<View className="min-w-0 flex-1">
											<Text className="text-sm font-semibold text-gray-900">
												{item.name}
											</Text>
											<Text className="text-xs text-gray-500">
												{item.description}
											</Text>
										</View>
										<Text className="text-xs font-semibold text-gray-800">
											{formatCurrency(item.price)} /{" "}
											{measurementSymbol[item.unit] ?? item.unit}
										</Text>
									</View>
								</Pressable>
							);
						})
					) : (
						<Text className="text-sm text-gray-500">
							Este estabelecimento não possui itens nesta categoria.
						</Text>
					)}
				</View>
			</Card>

			<Card className="gap-3 rounded-lg border-gray-200 p-3 shadow-none">
				<View className="flex-row gap-4">
					<Controller
						control={control}
						name="quantity"
						render={({ field: { value, onChange } }) => (
							<FormControl className="flex-1" isInvalid={!!errors.quantity}>
								<Text className="text-xs text-gray-500 mb-1">Quantidade</Text>
								<DecimalInput mode="decimal">
									<DecimalInputField
										value={value}
										onChangeText={onChange}
										className="text-sm"
									/>
								</DecimalInput>
								<FormControlError>
									<FormControlErrorIcon as={AlertCircleIcon} />
									<FormControlErrorText>
										{errors.quantity?.message}
									</FormControlErrorText>
								</FormControlError>
							</FormControl>
						)}
					/>

					<View className="gap-1">
						<Text className="text-xs text-gray-500">Unidade</Text>
						<Input className="w-18" isDisabled>
							<InputField
								value={
									selectedCatalogItem
										? (measurementSymbol[selectedCatalogItem.unit] ??
											selectedCatalogItem.unit)
										: ""
								}
								className="text-sm"
							/>
						</Input>
					</View>
				</View>

				<Card className="border-0 bg-lime-800/10 p-3 shadow-none">
					<View className="flex-row items-center justify-between">
						<View className="flex-row items-center gap-2">
							<Calculator size={16} color={colors.lime[800]} />
							<Text className="text-sm text-lime-800">Total do item</Text>
						</View>
						<Text className="text-base font-bold text-lime-800">
							{formatCurrency(total)}
						</Text>
					</View>
				</Card>

				<Button
					className="rounded-md bg-lime-800"
					onPress={handleSubmit(onSubmit)}
				>
					<ButtonText>Adicionar a simulação</ButtonText>
				</Button>
			</Card>

			<VStack className="gap-3 rounded-lg border-gray-200">
				<VStack>
					<Heading size="md">Lista</Heading>
					<Text className="text-muted-foreground text-sm">
						Deslize o card para a esquerda para deletar um item da lista.
					</Text>
				</VStack>

				{checkoutItems.length ? (
					checkoutItems.map(item => (
						<ReanimatedSwipeable
							key={`${item.itemType}-${item.itemId}`}
							renderRightActions={(_, translation, swipeable) => (
								<SwipeDeleteAction
									translation={translation}
									onDelete={() => {
										swipeable.close();
										setCheckoutItems(prev =>
											prev.filter(
												current =>
													!(
														current.itemId === item.itemId &&
														current.itemType === item.itemType
													),
											),
										);
										toast.success("Item removido da simulação.");
									}}
								/>
							)}
							overshootRight={false}
							friction={2}
						>
							<Card className="rounded-r-none shadow-none">
								<VStack className="gap-1">
									<HStack className="flex-1 justify-between">
										<Text className="font-semibold text-gray-900">
											{item.itemName}
										</Text>
										<Text className="font-semibold text-gray-900">
											{formatCurrency(item.total)}
										</Text>
									</HStack>
									<HStack className="flex-1 justify-between">
										<Text className="text-xs text-gray-500">
											{item.itemType === "waste" ? "Resíduo" : "Serviço"}
										</Text>
										<Text className="text-xs text-gray-500">
											{item.quantity} x {formatCurrency(item.unitPrice)} /{" "}
											{item.unit}
										</Text>
									</HStack>
								</VStack>

								{item.note && (
									<Text className="text-xs text-gray-500">
										Obs.: {item.note}
									</Text>
								)}
							</Card>
						</ReanimatedSwipeable>
					))
				) : (
					<Card className="shadow-none">
						<Text className="text-sm text-gray-500">
							Nenhum item adicionado a simulação.
						</Text>
					</Card>
				)}

				<Card className="border-0 bg-lime-800/10 p-3 shadow-none">
					<View className="flex-row items-center justify-between">
						<View className="flex-row items-center gap-2">
							<Calculator size={16} color={colors.lime[800]} />
							<Text className="text-sm text-lime-800">Total geral</Text>
						</View>
						<Text className="text-base font-bold text-lime-800">
							{formatCurrency(orderTotal)}
						</Text>
					</View>
				</Card>
			</VStack>
		</View>
	);
}
