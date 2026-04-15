import { ScrollView } from "react-native";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

export default function CollectorsScreen() {
  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerClassName="p-4 pb-8"
    >
      <Card className="shadow-none gap-2">
        <Heading>Para coletores</Heading>
        <Text className="text-muted-foreground">
          Em breve você poderá configurar seu perfil de coletor e acompanhar
          ganhos.
        </Text>
      </Card>
    </ScrollView>
  );
}
