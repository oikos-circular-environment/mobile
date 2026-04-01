import { ScrollView, View } from "react-native";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

export default function CompanyAddressScreen() {
  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerClassName="p-4 pb-8"
    >
      <Card className="shadow-none gap-2">
        <Heading>Endereço da empresa</Heading>
        <Text className="text-muted-foreground">
          Em breve você poderá cadastrar o endereço completo da sua empresa
          nesta tela.
        </Text>
      </Card>

      <View className="h-4" />

      <Card className="shadow-none">
        <Text className="text-muted-foreground">
          Use esta seção para informar rua, número, bairro, cidade e ponto de
          referência.
        </Text>
      </Card>
    </ScrollView>
  );
}
