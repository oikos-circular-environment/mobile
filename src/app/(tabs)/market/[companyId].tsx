import { format, getDay } from "date-fns";
import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
	ActivityIndicator,
	KeyboardAvoidingView,
	ScrollView,
	View,
} from "react-native";
import { BusinessHoursModal } from "@/components/market/business-hours-modal";
import { CompanyDetailGeneralTab } from "@/components/market/company-detail-general-tab";
import { CompanyDetailSimulationTab } from "@/components/market/company-detail-simulation-tab";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { useGeospatial } from "@/contexts/geospatial-context";
import { useMarket } from "@/contexts/market-context";
import {
	getCurrentBusinessHour,
	isCompanyOpenNow,
} from "@/libs/market/is-company-open";
import type { MarketSimulationItemType } from "@/libs/memory/market-simulations";
import { daysOfWeek } from "@/libs/types/business-hour";
import type { MarketBusinessHour } from "@/libs/types/market";

type MarketDetailTab = "general" | "simulation";

type SelectedSimulationItem = {
	itemType: MarketSimulationItemType;
	itemId: string;
};

const getDayLabel = (day: string) =>
	daysOfWeek.find(item => item.value === day)?.label ?? "Dia não informado";

const dayOfWeekByIndex = [
	"SUNDAY",
	"MONDAY",
	"TUESDAY",
	"WEDNESDAY",
	"THURSDAY",
	"FRIDAY",
	"SATURDAY",
] as const;

export default function MarketCompanyDetailScreen() {
	const { companyId } = useLocalSearchParams<{ companyId: string }>();
	const { getCompanyById, isPending, isLocationReady } = useMarket();
	const { currentDate } = useGeospatial();
	const [isBusinessHoursModalOpen, setIsBusinessHoursModalOpen] =
		useState(false);
	const [activeTab, setActiveTab] = useState<MarketDetailTab>("general");
	const [selectedSimulationItem, setSelectedSimulationItem] =
		useState<SelectedSimulationItem | null>(null);

	const company = companyId ? getCompanyById(companyId) : undefined;

	const currentDayOfWeek = dayOfWeekByIndex[getDay(currentDate)];

	const currentBusinessHour = useMemo<MarketBusinessHour | null>(
		() =>
			company
				? getCurrentBusinessHour(company.business_hours, currentDate)
				: null,
		[company, currentDate],
	);

	const isOpenNow = company
		? isCompanyOpenNow(company.business_hours, currentDate)
		: false;

	const currentTimeLabel = format(currentDate, "HH:mm");

	const defaultSimulationItem = useMemo<SelectedSimulationItem | null>(() => {
		if (!company) return null;

		const firstWaste = company.wastes[0];
		if (firstWaste) {
			return { itemType: "waste", itemId: firstWaste.id };
		}

		const firstService = company.services[0];
		if (firstService) {
			return { itemType: "service", itemId: firstService.id };
		}

		return null;
	}, [company]);

	const currentSimulationItem = selectedSimulationItem ?? defaultSimulationItem;

	if (!isLocationReady || isPending) {
		return (
			<>
				<Stack.Screen options={{ title: "Empresa", headerShown: true }} />
				<View className="flex-1 items-center justify-center bg-white">
					<ActivityIndicator size="small" color="#3F6212" />
				</View>
			</>
		);
	}

	if (!company) {
		return (
			<>
				<Stack.Screen options={{ title: "Empresa", headerShown: true }} />
				<ScrollView
					className="flex-1 bg-white"
					contentContainerClassName="p-4 pb-8"
					contentInsetAdjustmentBehavior="automatic"
				>
					<Card className="gap-2 shadow-none">
						<Heading size="xl">Empresa não encontrada</Heading>
						<Text className="text-sm text-gray-500">
							Não foi possível carregar os detalhes deste ponto de coleta.
						</Text>
					</Card>
				</ScrollView>
			</>
		);
	}

	return (
		<>
			<Stack.Screen
				options={{ title: company.corporate_name, headerShown: false }}
			/>

			<KeyboardAvoidingView behavior="padding" className="flex-1 bg-white">
				<ScrollView
					className="flex-1 bg-white"
					contentContainerClassName="p-4 pb-8"
					contentInsetAdjustmentBehavior="automatic"
					keyboardShouldPersistTaps="handled"
				>
					<View className="gap-4">
						<View className="flex-row gap-2 items-center">
							<View className="h-16 w-16 items-center justify-center rounded-[5px] bg-slate-950">
								<Text className="text-sm font-semibold text-white">
									{company.corporate_name
										.split(" ")
										.slice(0, 2)
										.map(word => word[0]?.toUpperCase() ?? "")
										.join("")}
								</Text>
							</View>

							<View className="min-w-0 flex-1 justify-center gap-0.5">
								<Heading className="text-xl text-gray-950">
									{company.corporate_name}
								</Heading>
								{company.business_name ? (
									<Text className="text-xs text-gray-500">
										{company.business_name}
									</Text>
								) : null}
							</View>
						</View>

						<Card className="gap-2 rounded-lg border-gray-200 p-1 shadow-none">
							<View className="flex-row gap-1">
								<Pressable
									className={`flex-1 items-center rounded-md px-3 py-2 ${activeTab === "general" ? "bg-lime-800" : "bg-transparent"}`}
									onPress={() => setActiveTab("general")}
								>
									<Text
										className={`text-sm font-semibold ${activeTab === "general" ? "text-white" : "text-gray-600"}`}
									>
										Geral
									</Text>
								</Pressable>

								<Pressable
									className={`flex-1 items-center rounded-md px-3 py-2 ${activeTab === "simulation" ? "bg-lime-800" : "bg-transparent"}`}
									onPress={() => setActiveTab("simulation")}
								>
									<Text
										className={`text-sm font-semibold ${activeTab === "simulation" ? "text-white" : "text-gray-600"}`}
									>
										Simulação
									</Text>
								</Pressable>
							</View>
						</Card>

						{activeTab === "general" ? (
							<CompanyDetailGeneralTab
								company={company}
								currentDayLabel={getDayLabel(currentDayOfWeek)}
								currentTimeLabel={currentTimeLabel}
								isOpenNow={isOpenNow}
								currentBusinessHour={currentBusinessHour}
								onOpenBusinessHoursModal={() =>
									setIsBusinessHoursModalOpen(true)
								}
								onSelectSimulationItem={(itemType, itemId) => {
									setSelectedSimulationItem({ itemType, itemId });
									setActiveTab("simulation");
								}}
							/>
						) : (
							<CompanyDetailSimulationTab
								company={company}
								selectedItem={currentSimulationItem}
							/>
						)}
					</View>
				</ScrollView>
			</KeyboardAvoidingView>

			<BusinessHoursModal
				isOpen={isBusinessHoursModalOpen}
				onClose={() => setIsBusinessHoursModalOpen(false)}
				businessHours={company.business_hours}
			/>
		</>
	);
}
