import { Check } from "lucide-react-native";
import { useMemo } from "react";
import { View } from "react-native";
import { Card } from "@/components/ui/card";
import {
  Checkbox,
  CheckboxIcon,
  CheckboxIndicator,
  CheckboxLabel,
} from "@/components/ui/checkbox";
import { Heading } from "@/components/ui/heading";
import { Input, InputField } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Text } from "@/components/ui/text";
import {
  type companyFinancial,
  type FinancialFlag,
  financialFlagsOptions,
  financialMeansOptions,
} from "@/libs/types/financial-method";

type FinancialEntry = (typeof companyFinancial)[number];

interface PaymentsTabProps {
  financial: FinancialEntry[];
  toggleEntryActive: (entryKey: string, value: boolean) => void;
  toggleFlag: (entryKey: string, flag: FinancialFlag, checked: boolean) => void;
  toggleAllFlags: (entryKey: string, checked: boolean) => void;
  updateObservation: (entryKey: string, value: string) => void;
  getEntryKey: (entry: FinancialEntry) => string;
}

const flagsOptionsWithoutAll = financialFlagsOptions.filter(
  option => option.value !== "ALL",
);

const tabDescription =
  "Pagamentos: como sua empresa paga clientes, parceiros ou fornecedores.";

export function PaymentsTab({
  financial,
  toggleEntryActive,
  toggleFlag,
  toggleAllFlags,
  updateObservation,
  getEntryKey,
}: PaymentsTabProps) {
  const meansLabelByValue = useMemo(
    () =>
      Object.fromEntries(
        financialMeansOptions.map(option => [option.value, option.label]),
      ),
    [],
  );

  return (
    <View className="gap-4">
      <Card className="shadow-none gap-2">
        <Heading size="sm">Sobre esta seção</Heading>
        <Text className="text-muted-foreground">{tabDescription}</Text>
        <Text className="text-muted-foreground">
          Os campos já vêm pré-definidos. Você pode ativar ou ajustar cada
          característica conforme a política financeira da empresa.
        </Text>
      </Card>

      {financial.map(entry => {
        const entryKey = getEntryKey(entry);
        const allFlagsSelected =
          !!entry.flags &&
          flagsOptionsWithoutAll.every(option =>
            entry.flags?.includes(option.value),
          );

        return (
          <Card key={entryKey} className="shadow-none gap-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Heading size="sm">
                  {meansLabelByValue[entry.financial_means]}
                </Heading>
                <Text className="text-muted-foreground">{entry.name}</Text>
              </View>
              <View className="items-end gap-1">
                <Text className="text-xs text-muted-foreground">Ativo</Text>
                <Switch
                  value={entry.active}
                  onValueChange={value => toggleEntryActive(entryKey, value)}
                  trackColor={{ false: "#d1d5db", true: "#84cc16" }}
                />
              </View>
            </View>

            {entry.financial_means === "CREDIT_CARD" ||
            entry.financial_means === "DEBIT_CARD" ? (
              <View className="gap-2">
                <Text className="text-sm">Bandeiras aceitas</Text>
                <Checkbox
                  value="ALL"
                  isChecked={allFlagsSelected}
                  onChange={checked => toggleAllFlags(entryKey, checked)}
                >
                  <CheckboxIndicator>
                    <CheckboxIcon as={Check} />
                  </CheckboxIndicator>
                  <CheckboxLabel>Todas as bandeiras</CheckboxLabel>
                </Checkbox>

                <View className="flex-row flex-wrap gap-3">
                  {flagsOptionsWithoutAll.map(flagOption => {
                    const checked =
                      entry.flags?.includes(flagOption.value) ?? false;

                    return (
                      <Checkbox
                        key={flagOption.value}
                        value={flagOption.value}
                        isChecked={checked}
                        onChange={value =>
                          toggleFlag(entryKey, flagOption.value, value)
                        }
                      >
                        <CheckboxIndicator>
                          <CheckboxIcon as={Check} />
                        </CheckboxIndicator>
                        <CheckboxLabel>{flagOption.label}</CheckboxLabel>
                      </Checkbox>
                    );
                  })}
                </View>
              </View>
            ) : null}

            <View className="gap-2">
              <Text className="text-sm">Observações</Text>
              <Input>
                <InputField
                  value={entry.observations ?? ""}
                  onChangeText={value => updateObservation(entryKey, value)}
                  placeholder="Adicione observações (opcional)"
                />
              </Input>
            </View>
          </Card>
        );
      })}
    </View>
  );
}
