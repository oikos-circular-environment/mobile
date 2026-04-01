import { ScrollView, View } from "react-native";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

export default function CompanyBusinessHoursScreen() {
  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerClassName="p-4 pb-8"
    >
      <Card className="shadow-none gap-2">
        <Heading>Funcionamento</Heading>
        <Text className="text-muted-foreground">
          Em breve você poderá definir os horários de funcionamento por dia da
          semana.
        </Text>
      </Card>

      <View className="h-4" />

      <Card className="shadow-none">
        <Text className="text-muted-foreground">
          Configure horários especiais e datas sem expediente para evitar
          informações desatualizadas.
        </Text>
      </Card>
    </ScrollView>
  );
}
