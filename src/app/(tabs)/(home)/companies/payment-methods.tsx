import { ScrollView, View } from "react-native";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

export default function CompanyPaymentMethodsScreen() {
  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerClassName="p-4 pb-8"
    >
      <Card className="shadow-none gap-2">
        <Heading>Métodos de pagamento</Heading>
        <Text className="text-muted-foreground">
          Em breve você poderá configurar os métodos de pagamento aceitos na sua
          empresa.
        </Text>
      </Card>

      <View className="h-4" />

      <Card className="shadow-none">
        <Text className="text-muted-foreground">
          Inclua opções como Pix, cartão, dinheiro e condições de recebimento.
        </Text>
      </Card>
    </ScrollView>
  );
}
