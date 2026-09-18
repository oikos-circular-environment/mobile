import {
	CornerUpRight,
	Hammer,
	MessageCircle,
	Phone,
	Recycle,
	TriangleAlert,
} from "lucide-react-native";
import type { ReactNode } from "react";
import { Linking, View } from "react-native";
import { colors } from "@/components/style/colors";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { useCompanyDetail } from "@/contexts/company-detail-context";
import { Divider } from "../ui/divider";
import { VStack } from "../ui/vstack";

const openWhatsAppOrSms = async (phone: string) => {
	const cleanPhone = phone.replace(/\D/g, "");
	const whatsappUrl = `whatsapp://send?phone=${cleanPhone}`;
	const canOpenWhatsApp = await Linking.canOpenURL(whatsappUrl);
	Linking.openURL(canOpenWhatsApp ? whatsappUrl : `sms:${phone}`);
};

const measurementSymbol: Record<string, string> = {
	KG: "kg",
	L: "L",
	UNIT: "un",
	M: "m",
	M2: "m²",
	M3: "m³",
	ML: "ml",
	DAY: "diária",
};

const formatCurrency = (value: number) =>
	new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
		minimumFractionDigits: 2,
	}).format(value);

type MarketItemCardProps = {
	icon: ReactNode;
	name: string;
	price: number;
	unit: string;
	description: string | null | undefined;
	categoryName: string;
	onPress: () => void;
};

function MarketItemCard({
	icon,
	name,
	price,
	unit,
	description,
	categoryName,
	onPress,
}: MarketItemCardProps) {
	return (
		<Pressable onPress={onPress}>
			<Card className="gap-2 shadow-none">
				<View className="flex-row items-center gap-2">
					<View className="bg-muted rounded-md size-10 items-center justify-center">
						{icon}
					</View>
					<VStack space="xs">
						<Text size="lg" className="font-bold">
							{name}
						</Text>
						<View className="flex-row items-end gap-0.5">
							<Text size="md" className="font-bold text-muted-foreground">
								{formatCurrency(price)}
							</Text>
							<Text size="sm" className="text-muted-foreground">
								/{measurementSymbol[unit]}
							</Text>
						</View>
					</VStack>
				</View>
				{description && <Text className="text-sm">{description}</Text>}
				<View className="flex-row flex-wrap gap-1">
					<Badge variant="outline">
						<BadgeText className="text-[10px]">{categoryName}</BadgeText>
					</Badge>
				</View>
			</Card>
		</Pressable>
	);
}

export function CompanyDetailGeneralTab() {
	const {
		company,
		currentDayLabel,
		currentTimeLabel,
		isOpenNow,
		currentBusinessHour,
		openBusinessHoursSheet,
		onSelectSimulationItem,
	} = useCompanyDetail();
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
								<CornerUpRight size={12} color={colors.gray[900]} />
							</View>
						</Card>
					</Pressable>
					{company.phones.length > 0 &&
						company.phones.map(phone => (
							<Card
								key={phone}
								className="flex-row items-center gap-2 shadow-none"
								size="sm"
							>
								<Text className="flex-1 text-md">{phone}</Text>
								<Pressable
									className="size-10 items-center justify-center rounded-[5px] bg-gray-100"
									onPress={() => Linking.openURL(`tel:${phone}`)}
								>
									<Phone size={12} color={colors.gray[900]} />
								</Pressable>
								<Pressable
									className="size-10 items-center justify-center rounded-[5px] bg-gray-100"
									onPress={() => openWhatsAppOrSms(phone)}
								>
									<MessageCircle size={12} color={colors.gray[900]} />
								</Pressable>
							</Card>
						))}
				</View>
			</View>

			<View className="gap-2">
				<Heading size="md" className="text-sm text-gray-950">
					Horário de funcionamento
				</Heading>
				<Text className="text-sm ">
					O horário de funcionamento pode variar, clique sobre o horário para
					mais detalhes.
				</Text>

				<Pressable onPress={openBusinessHoursSheet}>
					<Card className="gap-2 rounded-lg border-gray-200 shadow-none h-18 justify-center">
						<View className="flex-row items-center justify-between gap-2">
							<View>
								<View className="flex flex-row gap-2 items-center">
									<Text className="text-md font-bold ">{currentDayLabel}</Text>
									<Badge
										variant="soft"
										className={isOpenNow ? "bg-lime-100" : "bg-red-100"}
									>
										<BadgeText
											className={isOpenNow ? "text-lime-600" : "text-red-600"}
										>
											{isOpenNow ? "Aberto" : "Fechado"}
										</BadgeText>
									</Badge>
								</View>
								<Text className="text-xs">Agora são {currentTimeLabel}</Text>
							</View>
							<View className="items-end gap-1">
								{currentBusinessHour?.time_slots?.length ? (
									currentBusinessHour.time_slots.map(slot => (
										<Text key={slot.id} className="text-xs font-bold ">
											{slot.start_time} - {slot.end_time}
										</Text>
									))
								) : (
									<Text className="text-xs font-bold ">Fechado</Text>
								)}
							</View>
						</View>
					</Card>
				</Pressable>
			</View>

			<Divider />

			<Card className="flex-row items-center gap-2 border-0 bg-amber-100 p-2 shadow-none">
				<View className="h-10 w-10 items-center justify-center rounded-[5px]">
					<TriangleAlert size={16} color={colors.gray[500]} />
				</View>
				<View className="flex-1">
					<Text className="text-sm font-semibold text-gray-900">Atenção</Text>
					<Text className="text-xs ">
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
							<MarketItemCard
								key={waste.id}
								icon={<Recycle size={18} color={colors.gray[900]} />}
								name={waste.name}
								price={waste.price}
								unit={waste.unit}
								description={waste.description}
								categoryName={waste.waste_category.name}
								onPress={() => onSelectSimulationItem("waste", waste.id)}
							/>
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
							<MarketItemCard
								key={service.id}
								icon={<Hammer size={18} color={colors.gray[900]} />}
								name={service.name}
								price={service.price}
								unit={service.unit}
								description={service.description}
								categoryName={service.waste_category.name}
								onPress={() => onSelectSimulationItem("service", service.id)}
							/>
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
