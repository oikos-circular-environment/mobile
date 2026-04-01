import { ScrollView, View } from "react-native";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

export default function CompanyServicesScreen() {
  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerClassName="p-4 pb-8"
    >
      <Card className="shadow-none gap-2">
        <Heading>Serviços</Heading>
        <Text className="text-muted-foreground">
          Em breve você poderá descrever os serviços oferecidos pela sua
          empresa.
        </Text>
      </Card>

      <View className="h-4" />

      <Card className="shadow-none">
        <Text className="text-muted-foreground">
          Liste categorias, diferenciais e detalhes para facilitar a descoberta
          por clientes.
        </Text>
      </Card>
    </ScrollView>
  );
}
