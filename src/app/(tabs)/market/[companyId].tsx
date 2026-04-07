import {
  addDays,
  format,
  getDay,
  isBefore,
  isWithinInterval,
  parse,
} from "date-fns";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, ScrollView, View } from "react-native";
import { BusinessHoursModal } from "@/components/market/business-hours-modal";
import { CompanyDetailGeneralTab } from "@/components/market/company-detail-general-tab";
import { CompanyDetailSimulationTab } from "@/components/market/company-detail-simulation-tab";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Pressable as GPressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import type { MarketSimulationItemType } from "@/libs/memory/market-simulations";
import { getMarketCompanyById } from "@/libs/mocks/market-companies";
import { daysOfWeek } from "@/libs/types/business-hour";

type MarketDetailTab = "general" | "simulation";

type SelectedSimulationItem = {
  itemType: MarketSimulationItemType;
  itemId: string;
};

const formatIdentity = (identity: string, identityType: "CPF" | "CNPJ") => {
  if (identityType === "CNPJ") {
    return identity.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      "$1.$2.$3/$4-$5",
    );
  }

  return identity.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
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

const isTimeInsideSlot = (
  currentDate: Date,
  slot: { startTime: string; endTime: string },
) => {
  const slotStart = parse(slot.startTime, "HH:mm", currentDate);
  const parsedSlotEnd = parse(slot.endTime, "HH:mm", currentDate);

  if (
    Number.isNaN(slotStart.getTime()) ||
    Number.isNaN(parsedSlotEnd.getTime())
  ) {
    return false;
  }

  const slotEnd = isBefore(parsedSlotEnd, slotStart)
    ? addDays(parsedSlotEnd, 1)
    : parsedSlotEnd;

  return isWithinInterval(currentDate, {
    start: slotStart,
    end: slotEnd,
  });
};

export default function MarketCompanyDetailScreen() {
  const { companyId } = useLocalSearchParams<{ companyId: string }>();
  const company = getMarketCompanyById(companyId ?? "");
  const [isBusinessHoursModalOpen, setIsBusinessHoursModalOpen] =
    useState(false);
  const [activeTab, setActiveTab] = useState<MarketDetailTab>("general");
  const [selectedSimulationItem, setSelectedSimulationItem] =
    useState<SelectedSimulationItem | null>(null);
  const [currentDate, setCurrentDate] = useState(() => new Date());

  useEffect(() => {
    const syncClock = () => setCurrentDate(new Date());

    syncClock();
    const intervalId = setInterval(syncClock, 60_000);

    return () => clearInterval(intervalId);
  }, []);

  const currentDayOfWeek = dayOfWeekByIndex[getDay(currentDate)];
  const currentBusinessHour =
    company?.businessHours?.find(item => item.dayOfWeek === currentDayOfWeek) ??
    null;
  const isOpenNow = Boolean(
    currentBusinessHour?.is_open &&
      currentBusinessHour.timeSlots.some(slot =>
        isTimeInsideSlot(currentDate, slot),
      ),
  );
  const currentTimeLabel = format(currentDate, "HH:mm");

  const defaultSimulationItem = useMemo<SelectedSimulationItem | null>(() => {
    const firstWaste = company?.waste?.[0];
    if (firstWaste) {
      return { itemType: "waste", itemId: firstWaste.id };
    }

    const firstService = company?.services?.[0];
    if (firstService) {
      return { itemType: "service", itemId: firstService.id };
    }

    return null;
  }, [company?.services, company?.waste]);

  useEffect(() => {
    if (!company) {
      return;
    }

    if (!selectedSimulationItem) {
      setSelectedSimulationItem(defaultSimulationItem);
      return;
    }

    const isValidWaste =
      selectedSimulationItem.itemType === "waste" &&
      company.waste?.some(item => item.id === selectedSimulationItem.itemId);
    const isValidService =
      selectedSimulationItem.itemType === "service" &&
      company.services?.some(item => item.id === selectedSimulationItem.itemId);

    if (!isValidWaste && !isValidService) {
      setSelectedSimulationItem(defaultSimulationItem);
    }
  }, [
    company,
    company?.services,
    company?.waste,
    defaultSimulationItem,
    selectedSimulationItem,
  ]);

  const currentSimulationItem = selectedSimulationItem ?? defaultSimulationItem;

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
        options={{ title: company.corporateName, headerShown: false }}
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
                  {company.corporateName
                    .split(" ")
                    .slice(0, 2)
                    .map(word => word[0]?.toUpperCase() ?? "")
                    .join("")}
                </Text>
              </View>

              <View className="min-w-0 flex-1 justify-center gap-0.5">
                <Heading className="text-xl text-gray-950">
                  {company.corporateName}
                </Heading>
                <Text className="text-xs text-gray-500">
                  {company.businessName}
                </Text>
                <Text className="text-xs text-gray-500">
                  {formatIdentity(company.identity, company.identityType)}
                </Text>
              </View>
            </View>

            <Card className="gap-2 rounded-lg border-gray-200 p-1 shadow-none">
              <View className="flex-row gap-1">
                <GPressable
                  className={`flex-1 items-center rounded-md px-3 py-2 ${activeTab === "general" ? "bg-lime-800" : "bg-transparent"}`}
                  onPress={() => setActiveTab("general")}
                >
                  <Text
                    className={`text-sm font-semibold ${activeTab === "general" ? "text-white" : "text-gray-600"}`}
                  >
                    Geral
                  </Text>
                </GPressable>

                <GPressable
                  className={`flex-1 items-center rounded-md px-3 py-2 ${activeTab === "simulation" ? "bg-lime-800" : "bg-transparent"}`}
                  onPress={() => setActiveTab("simulation")}
                >
                  <Text
                    className={`text-sm font-semibold ${activeTab === "simulation" ? "text-white" : "text-gray-600"}`}
                  >
                    Simulação
                  </Text>
                </GPressable>
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
        businessHours={company.businessHours}
      />
    </>
  );
}
