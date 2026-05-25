import { Calculator } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Input, InputField } from "@/components/ui/input";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import {
	getMarketCheckoutDraft,
	type MarketCheckoutItemDraft,
	type MarketSimulationItemType,
	saveMarketCheckoutDraft,
} from "@/libs/memory/market-simulations";
import type { MarketCompany } from "@/libs/types/market";

type SimulationSelection = {
	itemType: MarketSimulationItemType;
	itemId: string;
};

type CompanyDetailSimulationTabProps = {
	company: MarketCompany;
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

	if (Number.isNaN(value) || value < 0) {
		return 0;
	}

	return value;
};

export function CompanyDetailSimulationTab({
	company,
	selectedItem,
}: CompanyDetailSimulationTabProps) {
	const [activeItemType, setActiveItemType] =
		useState<MarketSimulationItemType>(selectedItem?.itemType ?? "waste");
	const [selectedCatalogItemId, setSelectedCatalogItemId] = useState(
		selectedItem?.itemId ?? "",
	);
	const [quantity, setQuantity] = useState("1");
	const [note, setNote] = useState("");
	const [checkoutItems, setCheckoutItems] = useState<MarketCheckoutItemDraft[]>(
		[],
	);
	const [statusMessage, setStatusMessage] = useState<string | null>(null);

	const catalogItems = useMemo(() => {
		if (activeItemType === "waste") {
			return company.wastes ?? [];
		}

		return company.services ?? [];
	}, [activeItemType, company.services, company.wastes]);

	const selectedCatalogItem = useMemo(() => {
		if (!selectedCatalogItemId) {
			return catalogItems[0] ?? null;
		}

		return catalogItems.find(item => item.id === selectedCatalogItemId) ?? null;
	}, [catalogItems, selectedCatalogItemId]);

	useEffect(() => {
		const draft = getMarketCheckoutDraft(company.id);
		setCheckoutItems(draft?.items ?? []);
		setStatusMessage(null);
	}, [company.id]);

	useEffect(() => {
		if (!selectedItem) {
			return;
		}

		setActiveItemType(selectedItem.itemType);
		setSelectedCatalogItemId(selectedItem.itemId);
	}, [selectedItem]);

	useEffect(() => {
		if (!catalogItems.length) {
			setSelectedCatalogItemId("");
			return;
		}

		if (catalogItems.some(item => item.id === selectedCatalogItemId)) {
			return;
		}

		setSelectedCatalogItemId(catalogItems[0].id);
	}, [catalogItems, selectedCatalogItemId]);

	const parsedQuantity = parseNumber(quantity);
	const unitPrice = selectedCatalogItem?.price ?? 0;
	const total = parsedQuantity * unitPrice;
	const orderTotal = checkoutItems.reduce((acc, item) => acc + item.total, 0);

	const addItemToCheckout = () => {
		if (!selectedCatalogItem || parsedQuantity <= 0) {
			setStatusMessage("Informe uma quantidade maior que zero para adicionar.");
			return;
		}

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
			unit: measurementSymbol[selectedCatalogItem.unit] ?? selectedCatalogItem.unit,
			unitPrice,
			quantity: parsedQuantity,
			note,
			total,
		};

		if (existingIndex >= 0) {
			nextItems[existingIndex] = nextItem;
		} else {
			nextItems.push(nextItem);
		}

		setCheckoutItems(nextItems);
		setQuantity("1");
		setNote("");
		setStatusMessage("Item adicionado a simulação.");
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
							Produtos
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
					<View className="flex-1 gap-1">
						<Text className="text-xs text-gray-500">Quantidade</Text>
						<Input className="rounded-md border-gray-200 bg-white">
							<InputField
								value={quantity}
								onChangeText={setQuantity}
								keyboardType="decimal-pad"
								placeholder="1"
								className="text-sm"
							/>
						</Input>
					</View>

					<View className="gap-1">
						<Text className="text-xs text-gray-500">Unidade</Text>
						<Input className="rounded-md border-gray-200 bg-white" isDisabled>
							<InputField
								value={
									selectedCatalogItem
										? (measurementSymbol[selectedCatalogItem.unit] ?? selectedCatalogItem.unit)
										: ""
								}
								className="text-sm"
							/>
						</Input>
					</View>
				</View>

				<View className="gap-1">
					<Text className="text-xs text-gray-500">Observação</Text>
					<Input className="rounded-md border-gray-200 bg-white">
						<InputField
							value={note}
							onChangeText={setNote}
							placeholder="Ex.: retirada aos sábados"
							className="text-sm"
						/>
					</Input>
				</View>

				<Card className="border-0 bg-lime-800/10 p-3 shadow-none">
					<View className="flex-row items-center justify-between">
						<View className="flex-row items-center gap-2">
							<Calculator size={16} color="#3F6212" />
							<Text className="text-sm text-lime-800">Total do item</Text>
						</View>
						<Text className="text-base font-bold text-lime-800">
							{formatCurrency(total)}
						</Text>
					</View>
				</Card>

				<Button className="rounded-md bg-lime-800" onPress={addItemToCheckout}>
					<ButtonText>Adicionar a simulação</ButtonText>
				</Button>
			</Card>

			<Card className="gap-3 rounded-lg border-gray-200 p-3 shadow-none">
				<Heading size="md" className="text-base text-gray-950">
					Lista
				</Heading>

				{checkoutItems.length ? (
					checkoutItems.map(item => (
						<Card
							key={`${item.itemType}-${item.itemId}`}
							className="gap-2 border-gray-200 p-2 shadow-none"
						>
							<View className="flex-row items-center justify-between gap-2">
								<View className="min-w-0 flex-1">
									<Text className="text-sm font-semibold text-gray-900">
										{item.itemName}
									</Text>
									<Text className="text-xs text-gray-500">
										{item.itemType === "waste" ? "Produto" : "Serviço"}
									</Text>
								</View>

								<Text className="text-sm font-semibold text-gray-900">
									{formatCurrency(item.total)}
								</Text>
							</View>

							<View className="flex-row items-center justify-between">
								<Text className="text-xs text-gray-500">
									{item.quantity} x {formatCurrency(item.unitPrice)} /{" "}
									{item.unit}
								</Text>

								<Pressable
									onPress={() => {
										setCheckoutItems(prev =>
											prev.filter(
												current =>
													!(
														current.itemId === item.itemId &&
														current.itemType === item.itemType
													),
											),
										);
										setStatusMessage("Item removido da simulação.");
									}}
								>
									<Text className="text-xs font-semibold text-red-500">
										Remover
									</Text>
								</Pressable>
							</View>

							{item.note ? (
								<Text className="text-xs text-gray-500">
									Obs.: {item.note}
								</Text>
							) : null}
						</Card>
					))
				) : (
					<Text className="text-sm text-gray-500">
						Nenhum item adicionado a simulação.
					</Text>
				)}

				<Card className="border-0 bg-lime-800/10 p-3 shadow-none">
					<View className="flex-row items-center justify-between">
						<View className="flex-row items-center gap-2">
							<Calculator size={16} color="#3F6212" />
							<Text className="text-sm text-lime-800">Total geral</Text>
						</View>
						<Text className="text-base font-bold text-lime-800">
							{formatCurrency(orderTotal)}
						</Text>
					</View>
				</Card>

				<Button
					className="rounded-md bg-lime-800"
					onPress={() => {
						saveMarketCheckoutDraft({
							companyId: company.id,
							items: checkoutItems,
							updatedAt: Date.now(),
						});

						setStatusMessage("Orçamento salvo em memória no dispositivo.");
					}}
					isDisabled={!checkoutItems.length}
				>
					<ButtonText>Salvar orçamento</ButtonText>
				</Button>

				{statusMessage ? (
					<Text className="text-xs text-lime-800">{statusMessage}</Text>
				) : null}
			</Card>
		</View>
	);
}
