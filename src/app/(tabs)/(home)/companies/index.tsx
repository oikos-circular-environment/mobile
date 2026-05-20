import type { Href } from "expo-router";
import { Link } from "expo-router";
import {
	ArrowRightIcon,
	Clock3Icon,
	FactoryIcon,
	LockKeyholeIcon,
	type LucideIcon,
	MapPinIcon,
	RecycleIcon,
	SettingsIcon,
	WrenchIcon,
} from "lucide-react-native";
import { Pressable, ScrollView, View } from "react-native";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Progress, ProgressFilledTrack } from "@/components/ui/progress";
import { Text } from "@/components/ui/text";
import { useUserCompanyContext } from "@/contexts/user-company-context";

type CompanySetting = {
	title: string;
	description: string;
	icon: LucideIcon;
	href: Href;
};

const companyOptions: CompanySetting[] = [
	{
		title: "Empresa",
		description: "Informações cadastrais gerais sobre a sua empresa.",
		icon: FactoryIcon,
		href: "/(tabs)/(home)/companies/company",
	},
	{
		title: "Endereço",
		description: "Informe seu endereço para que as pessoas te encontre.",
		icon: MapPinIcon,
		href: "/(tabs)/(home)/companies/address",
	},
	{
		title: "Funcionamento",
		description: "Informe os dias e horários em que sua empresa está aberta.",
		icon: Clock3Icon,
		href: "/(tabs)/(home)/companies/business-hours",
	},
	{
		title: "Serviços",
		description: "Descreva os serviços que sua empresa oferece ao publico.",
		icon: WrenchIcon,
		href: "/(tabs)/(home)/companies/services/",
	},
	{
		title: "Gestão de resíduos",
		description: "Configure como sua empresa lida com os tipos de resíduos.",
		icon: RecycleIcon,
		href: "/(tabs)/(home)/companies/waste/",
	},
];

// const premiumResources: PremiumResource[] = [
//   {
//     title: "Agendamentos",
//     description: "Acompanhe e gerencie seus agendamentos de forma prática.",
//     icon: ClipboardClockIcon,
//   },
//   {
//     title: "Rotas",
//     description:
//       "Consulte o plano de rotas para otimizar a coleta dos seus resíduos.",
//     icon: RouteIcon,
//   },
// ];

export default function CompaniesHomeScreen() {
	const { company, completionRate } = useUserCompanyContext();
	const isCompanyRegistered = company != null;

	return (
		<ScrollView
			className="flex-1 bg-white"
			contentContainerClassName="px-4 pb-8 pt-10"
		>
			<View className="gap-8">
				<Card className="bg-secondary shadow-none">
					<View className="flex-row items-center justify-between gap-4">
						<View className="flex-1 gap-1">
							<Heading className="text-lg">Configurações</Heading>
							<Text className="text-sm text-muted-foreground leading-4">
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

					<Progress value={completionRate} className="h-2">
						<ProgressFilledTrack className="bg-lime-500" />
					</Progress>

					<View className="gap-2 pt-1">
						{companyOptions.map((option, index) => {
							const isLocked = index !== 0 && !isCompanyRegistered;

							const cardContent = (
								<Card className="shadow-none">
									<View className="flex-row items-center gap-3">
										<View className="size-8 items-center justify-center">
											<option.icon
												size={28}
												strokeWidth={1.5}
												className={
													isLocked ? "text-muted-foreground" : undefined
												}
											/>
										</View>

										<View className="flex-1">
											<Text
												className={`text-lg font-semibold ${isLocked ? "text-muted-foreground" : "text-foreground"}`}
											>
												{option.title}
											</Text>
											<Text className="text-muted-foreground">
												{option.description}
											</Text>
										</View>

										{isLocked ? (
											<LockKeyholeIcon
												size={18}
												className="text-muted-foreground"
											/>
										) : (
											<ArrowRightIcon size={18} />
										)}
									</View>
								</Card>
							);

							if (isLocked) {
								return <View key={option.title}>{cardContent}</View>;
							}

							return (
								<Link key={option.title} href={option.href} asChild>
									<Pressable>{cardContent}</Pressable>
								</Link>
							);
						})}
					</View>
				</View>

				{/* <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <Heading className="text-base">Recursos premium</Heading>
            <View className="size-8 items-center justify-center rounded-md bg-primary/10">
              <CrownIcon color="#3f6212" size={16} />
            </View>
          </View>

          <View className="gap-2 pt-1">
            {premiumResources.map(resource => (
              <Card key={resource.title} className="shadow-none">
                <View className="flex-row items-center gap-3">
                  <View className="size-8 items-center justify-center">
                    <resource.icon size={28} strokeWidth={1.5} />
                  </View>

                  <View className="flex-1">
                    <Text className="text-lg text-foreground font-semibold">
                      {resource.title}
                    </Text>
                    <Text className="text-muted-foreground">
                      {resource.description}
                    </Text>
                  </View>

                  <CrownIcon color="#3f6212" size={16} />
                </View>
              </Card>
            ))}
          </View>
        </View> */}
			</View>
		</ScrollView>
	);
}
