import { ScrollView, View } from "react-native";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

export default function CompanyWasteManagementScreen() {
  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerClassName="p-4 pb-8"
    >
      <Card className="shadow-none gap-2">
        <Heading>Gestão de resíduos</Heading>
        <Text className="text-muted-foreground">
          Em breve você poderá informar como sua empresa separa e destina
          resíduos.
        </Text>
      </Card>

      <View className="h-4" />

      <Card className="shadow-none">
        <Text className="text-muted-foreground">
          Essa etapa ajuda coletores e clientes a entenderem seu compromisso
          ambiental.
        </Text>
      </Card>
    </ScrollView>
  );
}
