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
import type { BusinessHour } from "@/libs/types/business-hour";
import type { Company } from "@/libs/types/companies";
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

type CompanyDetailGeneralTabProps = {
  company: Company;
  currentDayLabel: string;
  currentTimeLabel: string;
  isOpenNow: boolean;
  currentBusinessHour: BusinessHour | null;
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
  const phone = company.phones?.[0] ?? "Telefone não informado";

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
                  ? `${address.street}, ${address.number} - ${address.district}, ${address.city} - ${address.stateAcronym}, ${address.zipCode}`
                  : "Endereço não informado"}
              </Text>

              <View className="size-10 items-center justify-center rounded-[5px] bg-gray-100">
                <CornerUpRight size={12} color="#111827" />
              </View>
            </Card>
          </Pressable>

          <Pressable
            onPress={() => {
              if (phone === "Telefone não informado") {
                return;
              }

              const onlyDigits = phone.replace(/\D/g, "");
              Linking.openURL(`https://wa.me/55${onlyDigits}`);
            }}
          >
            <Card className="flex-row items-center gap-2 shadow-none">
              <Text className="flex-1 text-md">{phone}</Text>
              <View className="size-10 items-center justify-center rounded-[5px] bg-gray-100">
                <MessageCircle size={12} color="#111827" />
              </View>
            </Card>
          </Pressable>
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
                {currentBusinessHour?.timeSlots?.length ? (
                  currentBusinessHour.timeSlots.map(slot => (
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
            <Text className="text-sm font-semibold text-gray-900">Atenção</Text>
            <Text className="text-xs text-gray-700">
              Sempre faça separação e higienização do item, a qualidade impacta
              no valor do resíduo!
            </Text>
          </View>
        </Card>

        <View className="gap-2">
          {company.waste?.map(waste => (
            <Pressable
              key={waste.id}
              onPress={() => onSelectSimulationItem("waste", waste.id)}
            >
              <Card className="flex-row items-center gap-2 shadow-none">
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
            </Pressable>
          ))}
        </View>
      </View>

      <View className="gap-2">
        <Heading size="md" className="text-sm text-gray-950">
          Serviços
        </Heading>

        <View className="gap-2">
          {company.services?.map(service => (
            <Pressable
              key={service.id}
              onPress={() => onSelectSimulationItem("service", service.id)}
            >
              <Card className="flex-row items-center gap-2 shadow-none">
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
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}
