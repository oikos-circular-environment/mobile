import type { RelativePathString } from "expo-router";
import { Link } from "expo-router";
import {
  ArrowRight,
  BanknoteIcon,
  ClipboardClockIcon,
  Clock3Icon,
  CrownIcon,
  FactoryIcon,
  MapPinIcon,
  RecycleIcon,
  RouteIcon,
  SettingsIcon,
  WrenchIcon,
} from "lucide-react-native";
import { Pressable, ScrollView, View } from "react-native";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

type CompanySetting = {
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  href: RelativePathString;
};

type PremiumResource = {
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
};

const completionRate = 70;

const settings: CompanySetting[] = [
  {
    title: "Empresa",
    description: "Informe informações cadastrais gerais sobre a sua empresa.",
    icon: FactoryIcon,
    href: "./company",
  },
  {
    title: "Endereço",
    description: "Informe seu endereço para que as pessoas te encontre.",
    icon: MapPinIcon,
    href: "./address",
  },
  {
    title: "Funcionamento",
    description: "Informe os dias e horários em que sua empresa está aberta.",
    icon: Clock3Icon,
    href: "./business-hours",
  },
  {
    title: "Método de pagamento",
    description: "Cadastre as formas de pagamento e recebimento aceitas.",
    icon: BanknoteIcon,
    href: "./payment-methods",
  },
  {
    title: "Serviços",
    description: "Descreva os serviços que sua empresa oferece.",
    icon: WrenchIcon,
    href: "./services",
  },
  {
    title: "Gestão de resíduos",
    description: "Configure como sua empresa lida com os tipos de resíduos.",
    icon: RecycleIcon,
    href: "./waste-management",
  },
];

const premiumResources: PremiumResource[] = [
  {
    title: "Agendamentos",
    description: "Acompanhe e gerencie seus agendamentos de forma prática.",
    icon: ClipboardClockIcon,
  },
  {
    title: "Rotas",
    description:
      "Consulte o plano de rotas para otimizar a coleta dos seus resíduos.",
    icon: RouteIcon,
  },
];

export default function CompaniesHomeScreen() {
  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerClassName="px-4 pb-8 pt-10"
    >
      <View className="gap-8">
        <Card className="bg-secondary p-4 shadow-none rounded-md">
          <View className="flex-row items-center justify-between gap-4">
            <View className="flex-1 gap-1">
              <Heading className="text-base">Configurações</Heading>
              <Text className="text-[10px] text-muted-foreground leading-4">
                Preencha as infomações da sua empresa, desta forma você está
                apto para se expor.
              </Text>
            </View>

            <View className="size-12 items-center justify-center rounded-lg bg-primary">
              <SettingsIcon color="white" size={20} />
            </View>
          </View>
        </Card>

        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <Heading className="text-base">Informações cadastrais</Heading>
            <Text className="text-xs">{completionRate}%</Text>
          </View>

          <View className="h-2 rounded-full bg-muted overflow-hidden">
            <View
              className="h-2 rounded-full bg-lime-500"
              style={{ width: "26%" }}
            />
          </View>

          <View className="gap-2 pt-1">
            {settings.map(setting => (
              <Link key={setting.title} href={setting.href} asChild>
                <Pressable>
                  <Card className="rounded-xl border border-outline-200 px-2 py-2 shadow-none">
                    <View className="flex-row items-center gap-3">
                      <View className="size-8 items-center justify-center">
                        <setting.icon color="#111827" size={18} />
                      </View>

                      <View className="flex-1 gap-0">
                        <Text className="text-xs text-foreground">
                          {setting.title}
                        </Text>
                        <Text className="text-[10px] text-muted-foreground leading-3">
                          {setting.description}
                        </Text>
                      </View>

                      <ArrowRight color="#111827" size={18} />
                    </View>
                  </Card>
                </Pressable>
              </Link>
            ))}
          </View>
        </View>

        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <Heading className="text-base">Recursos premium</Heading>
            <View className="size-8 items-center justify-center rounded-md bg-primary/10">
              <CrownIcon color="#3f6212" size={16} />
            </View>
          </View>

          <View className="gap-2 pt-1">
            {premiumResources.map(resource => (
              <Card
                key={resource.title}
                className="rounded-xl border border-outline-200 px-2 py-2 shadow-none"
              >
                <View className="flex-row items-center gap-3">
                  <View className="size-8 items-center justify-center">
                    <resource.icon color="#111827" size={18} />
                  </View>

                  <View className="flex-1 gap-0">
                    <Text className="text-xs text-foreground">
                      {resource.title}
                    </Text>
                    <Text className="text-[10px] text-muted-foreground leading-3">
                      {resource.description}
                    </Text>
                  </View>

                  <CrownIcon color="#3f6212" size={16} />
                </View>
              </Card>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
