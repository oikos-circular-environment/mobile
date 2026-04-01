import { ScrollView, View } from "react-native";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

export default function CompanyGeneralInfoScreen() {
  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerClassName="p-4 pb-8"
    >
      <Card className="shadow-none gap-2">
        <Heading>Dados gerais da empresa</Heading>
        <Text className="text-muted-foreground">
          Em breve você poderá preencher razão social, CNPJ, contatos e outras
          informações cadastrais.
        </Text>
      </Card>

      <View className="h-4" />

      <Card className="shadow-none">
        <Text className="text-muted-foreground">
          Esta etapa centraliza as informações básicas para exibir sua empresa
          no app.
        </Text>
      </Card>
    </ScrollView>
  );
}
