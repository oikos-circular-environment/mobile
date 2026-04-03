import { Stack } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { PaymentsTab } from "@/components/companies/financial-methods/payments-tab";
import { ReceiptsTab } from "@/components/companies/financial-methods/receipts-tab";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import {
  companyFinancial,
  type Financial,
  type FinancialFlag,
  type FinancialType,
} from "@/libs/types/financial-method";

const tabLabels: Record<FinancialType, string> = {
  PAYMENT: "Pagamentos",
  RECEIPT: "Recebimentos",
};

const getEntryKey = (entry: Financial) =>
  `${entry.type}-${entry.financial_means}`;

export default function CompanyFinancialMethodsScreen() {
  const [activeTab, setActiveTab] = useState<FinancialType>("PAYMENT");
  const [financial, setFinancial] = useState<Financial[]>(companyFinancial);

  const updateEntry = (
    entryKey: string,
    updater: (entry: Financial) => Financial,
  ) => {
    setFinancial(current =>
      current.map(entry => {
        if (getEntryKey(entry) !== entryKey) return entry;
        return updater(entry);
      }),
    );
  };

  const toggleEntryActive = (entryKey: string, value: boolean) => {
    updateEntry(entryKey, entry => ({ ...entry, active: value }));
  };

  const toggleFlag = (
    entryKey: string,
    flag: FinancialFlag,
    checked: boolean,
  ) => {
    updateEntry(entryKey, entry => {
      const nextFlags = new Set(entry.flags ?? []);
      if (checked) {
        nextFlags.add(flag);
      } else {
        nextFlags.delete(flag);
      }

      return {
        ...entry,
        flags: nextFlags.size > 0 ? Array.from(nextFlags) : null,
      };
    });
  };

  const toggleAllFlags = (entryKey: string, checked: boolean) => {
    updateEntry(entryKey, entry => ({
      ...entry,
      flags: checked
        ? ["VISA", "MASTERCARD", "ELO", "AMEX", "HIPERCARD"]
        : null,
    }));
  };

  const updateObservation = (entryKey: string, value: string) => {
    updateEntry(entryKey, entry => ({ ...entry, observations: value }));
  };

  return (
    <>
      <Stack.Screen options={{ title: "Métodos Financeiros" }} />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          className="flex-1 bg-white"
          contentContainerClassName="p-4 pb-8"
        >
          <View className="gap-4">
            <Heading size="xl">Métodos Financeiros</Heading>

            <View className="flex-row items-center rounded-md border border-border p-1">
              <Button
                variant={activeTab === "PAYMENT" ? "secondary" : "ghost"}
                className="flex-1"
                onPress={() => setActiveTab("PAYMENT")}
              >
                <ButtonText>{tabLabels.PAYMENT}</ButtonText>
              </Button>
              <Button
                variant={activeTab === "RECEIPT" ? "secondary" : "ghost"}
                className="flex-1"
                onPress={() => setActiveTab("RECEIPT")}
              >
                <ButtonText>{tabLabels.RECEIPT}</ButtonText>
              </Button>
            </View>

            {activeTab === "PAYMENT" ? (
              <PaymentsTab
                financial={financial}
                toggleEntryActive={toggleEntryActive}
                toggleFlag={toggleFlag}
                toggleAllFlags={toggleAllFlags}
                updateObservation={updateObservation}
                getEntryKey={getEntryKey}
              />
            ) : (
              <ReceiptsTab
                financial={financial}
                toggleEntryActive={toggleEntryActive}
                toggleFlag={toggleFlag}
                toggleAllFlags={toggleAllFlags}
                updateObservation={updateObservation}
                getEntryKey={getEntryKey}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
