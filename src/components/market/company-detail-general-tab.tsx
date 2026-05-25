import {
	CornerUpRight,
	Hammer,
	MessageCircle,
	Recycle,
	TriangleAlert,
} from "lucide-react-native";
import { Linking, View } from "react-native";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import type { MarketSimulationItemType } from "@/libs/memory/market-simulations";
import type { MarketBusinessHour, MarketCompany } from "@/libs/types/market";
import { Divider } from "../ui/divider";

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

type CompanyDetailGeneralTabProps = {
	company: MarketCompany;
	currentDayLabel: string;
	currentTimeLabel: string;
	isOpenNow: boolean;
	currentBusinessHour: MarketBusinessHour | null;
	onOpenBusinessHoursModal: () => void;
	onSelectSimulationItem: (
		itemType: MarketSimulationItemType,
		itemId: string,
	) => void;
};

export function CompanyDetailGeneralTab({
	company,
	currentDayLabel,
	currentTimeLabel,
	isOpenNow,
	currentBusinessHour,
	onOpenBusinessHoursModal,
	onSelectSimulationItem,
}: CompanyDetailGeneralTabProps) {
	const address = company.address;

	return (
		<View className="gap-4">
			<View className="gap-2">
				<Heading size="md" className="text-sm text-gray-950">
					Informações
				</Heading>

				<View className="gap-2">
					<Pressable
						onPress={() => {
							if (!address) {
								return;
							}

							const query = encodeURIComponent(
								`${address.street}, ${address.number}, ${address.city}`,
							);
							Linking.openURL(
								`https://www.google.com/maps/search/?api=1&query=${query}`,
							);
						}}
					>
						<Card className="flex-row items-center gap-2 shadow-none">
							<Text className="flex-1 text-md">
								{address
									? `${address.street}, ${address.number} - ${address.district}, ${address.city} - ${address.state_code}, ${address.zip_code}`
									: "Endereço não informado"}
							</Text>

							<View className="size-10 items-center justify-center rounded-[5px] bg-gray-100">
								<CornerUpRight size={12} color="#111827" />
							</View>
						</Card>
					</Pressable>
					{company.phones.length > 0 &&
						company.phones.map(phone => (
							<Card
								key={phone}
								className="flex-row items-center gap-2 shadow-none"
							>
								<Text className="flex-1 text-md">{phone}</Text>
								<View className="size-10 items-center justify-center rounded-[5px] bg-gray-100">
									<MessageCircle size={12} color="#111827" />
								</View>
							</Card>
						))}
				</View>
			</View>

			<View className="gap-2">
				<Heading size="md" className="text-sm text-gray-950">
					Horário de funcionamento
				</Heading>
				<Text className="text-sm text-gray-700">
					O horário de funcionamento pode variar, clique sobre o horário para
					mais detalhes.
				</Text>

				<Pressable onPress={onOpenBusinessHoursModal}>
					<Card className="gap-2 rounded-lg border-gray-200 p-2 shadow-none">
						<View className="flex-row items-center justify-between gap-2">
							<View>
								<View className="flex flex-row gap-2 items-center">
									<Text className="text-md font-bold text-gray-700">
										{currentDayLabel}
									</Text>
									<Badge variant={isOpenNow ? "default" : "destructive"}>
										<BadgeText>{isOpenNow ? "Aberto" : "Fechado"}</BadgeText>
									</Badge>
								</View>
								<Text className="text-xs">Agora são {currentTimeLabel}</Text>
							</View>
							<View className="items-end gap-1">
								{currentBusinessHour?.time_slots?.length ? (
									currentBusinessHour.time_slots.map(slot => (
										<Text
											key={slot.id}
											className="text-xs font-bold text-gray-700"
										>
											{slot.start_time} - {slot.end_time}
										</Text>
									))
								) : (
									<Text className="text-xs font-bold text-gray-700">
										Fechado
									</Text>
								)}
							</View>
						</View>
					</Card>
				</Pressable>
			</View>

			<Divider />

			<Card className="flex-row items-center gap-2 border-0 bg-amber-100 p-2 shadow-none">
				<View className="h-10 w-10 items-center justify-center rounded-[5px]">
					<TriangleAlert size={16} color="#6B7280" />
				</View>
				<View className="flex-1">
					<Text className="text-sm font-semibold text-gray-900">Atenção</Text>
					<Text className="text-xs text-gray-700">
						Sempre faça separação e higienização do item, a qualidade impacta no
						valor do resíduo!
					</Text>
				</View>
			</Card>

			<View className="gap-2">
				<Heading size="md" className="text-sm text-gray-950">
					Produtos
				</Heading>

				<View className="gap-2">
					{company.wastes.length > 0 ? (
						company.wastes.map(waste => (
							<Pressable
								key={waste.id}
								onPress={() => onSelectSimulationItem("waste", waste.id)}
							>
								<Card className="gap-2 shadow-none">
									<View className="flex-row items-center gap-2">
										<View className="bg-muted rounded-md h-10 w-10 items-center justify-center">
											<Recycle size={18} color="#111827" />
										</View>

										<View className="min-w-0 flex-1 flex-row items-center justify-between gap-2">
											<Text className="flex-1 text-md font-semibold text-gray-900">
												{waste.name}
											</Text>
											<View className="flex-row items-end gap-0.5">
												<Text className="text-md font-bold text-gray-900">
													{formatCurrency(waste.price)}
												</Text>
												<Text className="text-xs text-gray-400">
													/{measurementSymbol[waste.unit]}
												</Text>
											</View>
										</View>
									</View>

									{waste.description ? (
										<Text className="text-sm text-gray-700">
											{waste.description}
										</Text>
									) : null}

									{waste.sub_items?.length ? (
										<View className="flex-row flex-wrap gap-1">
											{waste.sub_items.map(sub => (
												<Badge key={`${waste.id}-${sub}`} variant="outline">
													<BadgeText className="text-[10px]">{sub}</BadgeText>
												</Badge>
											))}
										</View>
									) : null}
								</Card>
							</Pressable>
						))
					) : (
						<Card className="shadow-none bg-gray-50 p-3">
							<Text className="text-sm text-gray-500">
								Nenhum produto cadastrado para esta empresa.
							</Text>
						</Card>
					)}
				</View>
			</View>

			<View className="gap-2">
				<Heading size="md" className="text-sm text-gray-950">
					Serviços
				</Heading>

				<View className="gap-2">
					{company.services.length > 0 ? (
						company.services.map(service => (
							<Pressable
								key={service.id}
								onPress={() => onSelectSimulationItem("service", service.id)}
							>
								<Card className="gap-2 shadow-none">
									<View className="flex-row items-center gap-2">
										<View className="bg-muted rounded-md size-10 items-center justify-center">
											<Hammer size={18} color="#111827" />
										</View>

										<View className="min-w-0 flex-1 flex-row items-center justify-between gap-2">
											<Text className="flex-1 text-md font-semibold text-gray-900">
												{service.name}
											</Text>
											<View className="flex-row items-end gap-0.5">
												<Text className="text-md font-bold text-gray-900">
													{formatCurrency(service.price)}
												</Text>
												<Text className="text-xs text-gray-400">
													/{measurementSymbol[service.unit]}
												</Text>
											</View>
										</View>
									</View>

									{service.description ? (
										<Text className="text-sm text-gray-700">
											{service.description}
										</Text>
									) : null}

									{service.sub_items?.length ? (
										<View className="flex-row flex-wrap gap-1">
											{service.sub_items.map(sub => (
												<Badge key={`${service.id}-${sub}`} variant="outline">
													<BadgeText className="text-[10px]">{sub}</BadgeText>
												</Badge>
											))}
										</View>
									) : null}
								</Card>
							</Pressable>
						))
					) : (
						<Card className="shadow-none bg-gray-50 p-3">
							<Text className="text-sm text-gray-500">
								Nenhum serviço cadastrado para esta empresa.
							</Text>
						</Card>
					)}
				</View>
			</View>
		</View>
	);
}
