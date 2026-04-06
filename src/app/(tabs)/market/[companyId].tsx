import { Stack, useLocalSearchParams } from "expo-router";
import {
  CornerUpRight,
  Hammer,
  MessageCircle,
  Recycle,
  TriangleAlert,
} from "lucide-react-native";
import { useState } from "react";
import { Linking, Pressable, ScrollView, View } from "react-native";
import { BusinessHoursModal } from "@/components/market/business-hours-modal";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { getMarketCompanyById } from "@/libs/mocks/market-companies";
import { daysOfWeek } from "@/libs/types/business-hour";
import type { Measurement } from "@/libs/types/measurement";

const measurementSymbol: Record<Measurement, string> = {
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

export default function MarketCompanyDetailScreen() {
  const { companyId } = useLocalSearchParams<{ companyId: string }>();
  const company = getMarketCompanyById(companyId ?? "");
  const [isBusinessHoursModalOpen, setIsBusinessHoursModalOpen] =
    useState(false);

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

  const wednesdayHour = company.businessHours?.find(
    item => item.dayOfWeek === "WEDNESDAY",
  );
  const defaultBusinessHour =
    wednesdayHour ?? company.businessHours?.[0] ?? null;

  const address = company.address;
  const phone = company.phones?.[0] ?? "Telefone não informado";

  return (
    <>
      <Stack.Screen
        options={{ title: company.corporateName, headerShown: false }}
      />

      <ScrollView
        className="flex-1 bg-white"
        contentContainerClassName="p-4 pb-8"
        contentInsetAdjustmentBehavior="automatic"
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

          <View className="gap-2">
            <Heading size="md" className="text-sm text-gray-950">
              Informações
            </Heading>

            <View className="gap-2">
              <Card className="flex-row items-center gap-2 shadow-none">
                <Text className="flex-1 text-md">
                  {address
                    ? `${address.street}, ${address.number} - ${address.district}, ${address.city} - ${address.stateAcronym}, ${address.zipCode}`
                    : "Endereço não informado"}
                </Text>

                <Pressable
                  className="size-10 items-center justify-center rounded-[5px] bg-gray-100"
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
                  <CornerUpRight size={12} color="#111827" />
                </Pressable>
              </Card>

              <Card className="flex-row items-center gap-2 shadow-none">
                <Text className="flex-1 text-md">{phone}</Text>
                <Pressable
                  className="size-10 items-center justify-center rounded-[5px] bg-gray-100"
                  onPress={() => {
                    if (phone === "Telefone não informado") {
                      return;
                    }

                    const onlyDigits = phone.replace(/\D/g, "");
                    Linking.openURL(`https://wa.me/55${onlyDigits}`);
                  }}
                >
                  <MessageCircle size={12} color="#111827" />
                </Pressable>
              </Card>
            </View>
          </View>

          <View className="gap-2">
            <Heading size="md" className="text-sm text-gray-950">
              Horário de funcionamento
            </Heading>
            <Text className="text-sm text-gray-700">
              O horário de funcionamento pode variar, clique sobre o horário
              para mais detalhes.
            </Text>

            <Pressable onPress={() => setIsBusinessHoursModalOpen(true)}>
              <Card className="gap-2 rounded-lg border-gray-200 p-2 shadow-none">
                <View className="flex-row items-center justify-between gap-2">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-md font-bold text-gray-700">
                      {defaultBusinessHour
                        ? getDayLabel(defaultBusinessHour.dayOfWeek)
                        : "Horário"}
                    </Text>
                    <Badge
                      variant={
                        defaultBusinessHour?.is_open ? "default" : "destructive"
                      }
                    >
                      <BadgeText>
                        {defaultBusinessHour?.is_open ? "Aberto" : "Fechado"}
                      </BadgeText>
                    </Badge>
                  </View>

                  <View className="items-end">
                    {defaultBusinessHour?.timeSlots?.length ? (
                      defaultBusinessHour.timeSlots.map(slot => (
                        <Text
                          key={slot.id}
                          className="text-xs font-bold text-gray-700"
                        >
                          {slot.startTime} - {slot.endTime}
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
          <View className="gap-2">
            <Heading size="md" className="text-sm text-gray-950">
              Produtos
            </Heading>

            <Card className="flex-row items-center gap-2 border-0 bg-amber-100 p-2 shadow-none">
              <View className="h-10 w-10 items-center justify-center rounded-[5px]">
                <TriangleAlert size={16} color="#6B7280" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-900">
                  Atenção
                </Text>
                <Text className="text-xs text-gray-700">
                  Sempre faça separação e higienização do item, a qualidade
                  impacta no valor do resíduo!
                </Text>
              </View>
            </Card>

            <View className="gap-2">
              {company.waste?.map(waste => (
                <Card
                  key={waste.id}
                  className="flex-row items-center gap-2 shadow-none"
                >
                  <View className="h-10 w-10 items-center justify-center ">
                    <Recycle size={22} color="#111827" />
                  </View>

                  <View className="min-w-0 flex-1">
                    <Text className="text-md font-semibold text-gray-900">
                      {waste.name}
                    </Text>
                    <Text className="text-sm text-gray-700">
                      {waste.description}
                    </Text>
                  </View>

                  <View className="flex-row items-end gap-0.5">
                    <Text className="text-md font-bold text-gray-900">
                      {formatCurrency(waste.price)}
                    </Text>
                    <Text className="text-xs text-gray-400">
                      {measurementSymbol[waste.unit]}
                    </Text>
                  </View>
                </Card>
              ))}
            </View>
          </View>

          <View className="gap-2">
            <Heading size="md" className="text-sm text-gray-950">
              Serviços
            </Heading>

            <View className="gap-2">
              {company.services?.map(service => (
                <Card
                  key={service.id}
                  className="flex-row items-center gap-2 shadow-none"
                >
                  <View className="size-10 items-center justify-center">
                    <Hammer size={22} color="#111827" />
                  </View>

                  <View className="min-w-0 flex-1">
                    <Text className="text-md font-semibold text-gray-900">
                      {service.name}
                    </Text>
                    <Text className="text-sm text-gray-700">
                      {service.description}
                    </Text>
                  </View>

                  <View className="flex-row items-end gap-0.5">
                    <Text className="text-md font-bold text-gray-900">
                      {formatCurrency(service.price)}
                    </Text>
                    <Text className="text-xs text-gray-400">
                      {measurementSymbol[service.unit]}
                    </Text>
                  </View>
                </Card>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <BusinessHoursModal
        isOpen={isBusinessHoursModalOpen}
        onClose={() => setIsBusinessHoursModalOpen(false)}
        businessHours={company.businessHours}
      />
    </>
  );
}
