import type { Href } from "expo-router";
import { Link, Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
	ArrowRightIcon,
	ChevronLeftIcon,
	Clock8Icon,
	FactoryIcon,
	HammerIcon,
	LockKeyholeIcon,
	type LucideIcon,
	MapIcon,
	RecycleIcon,
	SettingsIcon,
	TriangleAlertIcon,
} from "lucide-react-native";
import { Pressable, ScrollView, View } from "react-native";
import { useCompanyValidations } from "@/components/companies/hooks/use-company-validations";
import { useToggleCompanyStatus } from "@/components/companies/hooks/use-toggle-company-status";
import { colors } from "@/components/style/colors";
import { Alert, AlertIcon, AlertText } from "@/components/ui/alert";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Switch } from "@/components/ui/switch";
import { Text } from "@/components/ui/text";
import { useCompaniesStore } from "@/stores/companies-store";

type CompanySetting = {
	title: string;
	description: string;
	icon: LucideIcon;
	href: Href;
	validation: {
		is_validation: boolean;
		description: string;
	};
};

export default function CompanyHubScreen() {
	const router = useRouter();
	const { companyId } = useLocalSearchParams<{ companyId: string }>();
	const company = useCompaniesStore(s =>
		s.companies.find(c => c.id === companyId),
	);
	const isCompanyRegistered = company != null;

	const { mutate: toggleStatus, isPending: isTogglingStatus } =
		useToggleCompanyStatus(companyId);

	const { data: validation } = useCompanyValidations(companyId);

	const companyOptions: CompanySetting[] = [
		{
			title: "Empresa",
			description: "Informações cadastrais gerais sobre a sua empresa.",
			icon: FactoryIcon,
			href: {
				pathname: "/(tabs)/(home)/companies/[companyId]/company",
				params: { companyId },
			},
			validation: {
				is_validation: validation?.general_registration ?? false,
				description: "Todos os dados obrigatórios devem ser preenchidos",
			},
		},
		{
			title: "Endereço",
			description: "Informe seu endereço para que as pessoas te encontre.",
			icon: MapIcon,
			href: {
				pathname: "/(tabs)/(home)/companies/[companyId]/address",
				params: { companyId },
			},
			validation: {
				is_validation: validation?.address ?? false,
				description: "Todos os dados obrigatórios devem ser preenchidos.",
			},
		},
		{
			title: "Funcionamento",
			description: "Informe os dias e horários em que sua empresa está aberta.",
			icon: Clock8Icon,
			href: {
				pathname: "/(tabs)/(home)/companies/[companyId]/business-hours",
				params: { companyId },
			},
			validation: {
				is_validation: validation?.business_hours ?? false,
				description: "Deve abrir ao menos 1x na semana.",
			},
		},
		{
			title: "Serviços",
			description: "Descreva os serviços que sua empresa oferece ao publico.",
			icon: HammerIcon,
			href: {
				pathname: "/(tabs)/(home)/companies/[companyId]/services",
				params: { companyId },
			},
			validation: {
				is_validation: validation?.services ?? false,
				description:
					"Deve haver ao menos 1 (um) Serviço ou Resíduo cadastrado.",
			},
		},
		{
			title: "Resíduos",
			description:
				"Caso seja um ponto de coleta de resíduo, especifique com quais resíduos você trabalha.",
			icon: RecycleIcon,
			href: {
				pathname: "/(tabs)/(home)/companies/[companyId]/waste",
				params: { companyId },
			},
			validation: {
				is_validation: validation?.wastes ?? false,
				description:
					"Deve haver ao menos 1 (um) Serviço ou Resíduo cadastrado.",
			},
		},
	];

	return (
		<>
			<Stack.Screen
				options={{
					headerLeft: () => (
						<Pressable onPress={() => router.back()} className="pl-1">
							<ChevronLeftIcon size={24} className="text-foreground" />
						</Pressable>
					),
				}}
			/>
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
								<SettingsIcon color={colors.white} size={20} />
							</View>
						</View>
					</Card>

					<Alert className="gap-3 bg-amber-100 border-amber-400">
						<AlertIcon as={TriangleAlertIcon} className="text-amber-400" />
						<AlertText className="text-foreground/80">
							Para que sua empresa seja listada no Mercado, é necessário que
							tenha todos os dados preenchidos e com dados reais. A cada seção
							haverá um indicador auxiliando no nível de validação dos dados.
						</AlertText>
					</Alert>

					<Card className="shadow-none">
						{isCompanyRegistered && (
							<View className="flex-row items-center justify-between">
								<View className="flex-row items-center gap-2">
									<Text className="text-sm font-medium">
										{company.status ? "Empresa ativa" : "Empresa inativa"}
									</Text>
								</View>
								<Switch
									size="sm"
									value={company.status}
									onValueChange={toggleStatus}
									isDisabled={isTogglingStatus}
								/>
							</View>
						)}
					</Card>
					<View className="gap-2">
						<View className="gap-2 pt-1">
							{companyOptions.map((option, index) => {
								const isLocked = index !== 0 && !isCompanyRegistered;

								const cardContent = (
									<Card className="shadow-none">
										<View className="flex-row items-center gap-3">
											<View className="size-8 items-center justify-center">
												<option.icon size={28} strokeWidth={1.5} />
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
										{!option.validation.is_validation && (
											<Badge
												variant="outline"
												className="flex-row justify-start items-start bg-rose-100 border border-rose-200"
											>
												<BadgeText className="normal-case text-start text-muted-foreground">
													{option.validation.description}
												</BadgeText>
											</Badge>
										)}
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
				</View>
			</ScrollView>
		</>
	);
}
