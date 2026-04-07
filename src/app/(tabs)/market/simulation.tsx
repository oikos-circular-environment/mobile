import { Stack, useLocalSearchParams } from "expo-router";
import { Calculator, Package, Wrench } from "lucide-react-native";
import { useMemo, useState } from "react";
import { KeyboardAvoidingView, ScrollView, View } from "react-native";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import {
  getMarketSimulationDraft,
  type MarketSimulationItemType,
  saveMarketSimulationDraft,
} from "@/libs/memory/market-simulations";
import { getMarketCompanyById } from "@/libs/mocks/market-companies";
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

const parseNumber = (rawValue: string) => {
  const normalized = rawValue.replace(",", ".").trim();
  const value = Number(normalized);

  if (Number.isNaN(value) || value < 0) {
    return 0;
  }

  return value;
};

export default function MarketSimulationScreen() {
  const { companyId, itemType, itemId } = useLocalSearchParams<{
    companyId: string;
    itemType: MarketSimulationItemType;
    itemId: string;
  }>();

  const company = getMarketCompanyById(companyId ?? "");

  const item = useMemo(() => {
    if (!company || !itemType || !itemId) {
      return null;
    }

    if (itemType === "waste") {
      return company.waste?.find(entry => entry.id === itemId) ?? null;
    }

    return company.services?.find(entry => entry.id === itemId) ?? null;
  }, [company, itemId, itemType]);

  const initialDraft = useMemo(() => {
    if (!companyId || !itemType || !itemId) {
      return null;
    }

    return getMarketSimulationDraft(companyId, itemType, itemId);
  }, [companyId, itemId, itemType]);

  const [quantity, setQuantity] = useState(
    initialDraft?.quantity ? String(initialDraft.quantity) : "1",
  );
  const [note, setNote] = useState(initialDraft?.note ?? "");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const parsedQuantity = parseNumber(quantity);
  const unitPrice = item?.price ?? 0;
  const total = parsedQuantity * unitPrice;

  if (!company || !item || !itemType) {
    return (
      <>
        <Stack.Screen options={{ title: "Simulação", headerShown: true }} />
        <ScrollView
          className="flex-1 bg-white"
          contentContainerClassName="p-4 pb-8"
          contentInsetAdjustmentBehavior="automatic"
        >
          <Card className="gap-2 shadow-none">
            <Heading size="lg">Item não encontrado</Heading>
            <Text className="text-sm text-gray-500">
              Não foi possível carregar os dados para simulação.
            </Text>
          </Card>
        </ScrollView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Simulação", headerShown: false }} />

      <KeyboardAvoidingView
        behavior={process.env.EXPO_OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-white"
      >
        <ScrollView
          className="flex-1 bg-white"
          contentContainerClassName="p-4 pb-8"
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-4">
            <Card className="gap-3 rounded-lg border-gray-200 p-3 shadow-none">
              <View className="flex-row items-center gap-2">
                <View className="size-8 items-center justify-center rounded-[5px] bg-gray-100">
                  {itemType === "waste" ? (
                    <Package size={16} color="#111827" />
                  ) : (
                    <Wrench size={16} color="#111827" />
                  )}
                </View>
                <View className="min-w-0 flex-1">
                  <Heading size="md" className="text-base text-gray-950">
                    {item.name}
                  </Heading>
                  <Text className="text-xs text-gray-500">
                    {company.corporateName}
                  </Text>
                </View>
              </View>

              <Text className="text-sm text-gray-600">{item.description}</Text>

              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-gray-500">Valor unitário</Text>
                <Text className="text-sm font-semibold text-gray-900">
                  {formatCurrency(unitPrice)} / {measurementSymbol[item.unit]}
                </Text>
              </View>
            </Card>

            <Card className="gap-3 rounded-lg border-gray-200 p-3 shadow-none">
              <View className="gap-1">
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
                    <Text className="text-sm text-lime-800">
                      Total estimado
                    </Text>
                  </View>
                  <Text className="text-base font-bold text-lime-800">
                    {formatCurrency(total)}
                  </Text>
                </View>
              </Card>

              <Button
                className="rounded-md bg-lime-800"
                onPress={() => {
                  saveMarketSimulationDraft({
                    companyId,
                    itemId,
                    itemType,
                    quantity: parsedQuantity,
                    note,
                    unitPrice,
                    total,
                    updatedAt: Date.now(),
                  });

                  setStatusMessage(
                    "Simulação salva em memória no dispositivo.",
                  );
                }}
              >
                <ButtonText>Salvar simulação</ButtonText>
              </Button>

              {statusMessage ? (
                <Text className="text-xs text-lime-800">{statusMessage}</Text>
              ) : null}
            </Card>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
