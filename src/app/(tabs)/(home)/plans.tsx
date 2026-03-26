import { ArrowUpRightIcon } from "lucide-react-native";
import { ScrollView, View } from "react-native";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

type PlanOption = {
  id: string;
  title: string;
  description: string;
  price?: number;
  is_active: boolean;
  options: string[];
};

const plans: PlanOption[] = [
  {
    id: "free",
    title: "Plano Gratuito",
    description:
      "Aproveite os recursos essenciais para começar a usar nossa plataforma sem custos.",
    options: [
      "Faça buscas ilimitadas por empresas, produtos e serviços",
      "Aprenda sobre sustentabilidade e práticas ecológicas",
      "Faça denúncias de forma anônima",
    ],
    is_active: true,
  },
  {
    id: "pro",
    title: "Empresas",
    description:
      "Soluções avançadas para empresas que buscam se destacar no mercado sustentável",
    options: [
      "Crie campanhas de daações",
      "Gerencie suas empresas, produtos e serviços",
      "Gerencie suas rotas de coletas e ganhos",
      "Compreenda as tendencias e indices do mercado",
    ],
    price: 159.99,
    is_active: false,
  },
  {
    id: "government",
    title: "Governamental",
    description: "Soluções específicas para órgãos públicos",
    options: [
      "Tenha acesso aos dados de sustentabilidade de sua cidade",
      "Rastreie e resolva as denuncias de forma eficiente",
      "Relatórios personalizados",
    ],
    price: 1599.99,
    is_active: false,
  },
];

export default function PlansScreen() {
  return (
    <ScrollView className="flex-1 p-4 bg-white">
      <View className="flex flex-col gap-4">
        {plans.map(plan => (
          <Card key={plan.id} className="flex flex-col gap-4 shadow-none">
            <View className="flex flex-row justify-between items-center">
              <Heading className="text-2xl">{plan.title}</Heading>
              {plan.is_active ? (
                <Badge variant="default">
                  <Text className="font-medium text-muted">Ativo</Text>
                </Badge>
              ) : (
                <Badge variant="outline">
                  <Text>
                    R${" "}
                    {plan.price?.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    / mês
                  </Text>
                </Badge>
              )}
            </View>
            <Text className="text-muted-foreground">{plan.description}</Text>
            <View className="flex flex-col gap-2">
              {plan.options.map(option => (
                <View key={option} className="flex flex-row items-center gap-2">
                  <ArrowUpRightIcon color="#3d6300" />
                  <Text>{option}</Text>
                </View>
              ))}
            </View>

            {!plan.is_active && (
              <Button variant="outline" size="lg">
                <Text>Experimentar por 30 dias grátis</Text>
              </Button>
            )}
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}
