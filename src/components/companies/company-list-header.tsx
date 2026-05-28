import { router } from "expo-router";
import { BuildingIcon, Plus } from "lucide-react-native";
import { View } from "react-native";
import { colors } from "@/components/style/colors";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

export function CompanyListHeader() {
	const handleNewCompany = () => {
		router.push({
			pathname: "/(tabs)/(home)/companies/[companyId]/company",
			params: { companyId: "new-company" },
		});
	};

	return (
		<View className="gap-4">
			<Card className="bg-gray-100 p-4 shadow-none">
				<View className="flex-row items-center gap-4">
					<View className="flex-1 gap-1">
						<Heading>Empresas</Heading>
						<Text className="text-sm text-gray-500">
							Gerencie suas empresas cadastradas na plataforma.
						</Text>
					</View>

					<View className="size-14 items-center justify-center rounded-lg bg-lime-800">
						<BuildingIcon size={24} color={colors.white} strokeWidth={2.25} />
					</View>
				</View>
			</Card>

			<Button size="lg" onPress={handleNewCompany}>
				<ButtonText className="flex-1 text-center font-semibold text-white">
					Nova Empresa
				</ButtonText>
				<ButtonIcon as={Plus} className="text-white" height={18} width={18} />
			</Button>

			<View>
				<Heading>Minhas Empresas</Heading>
			</View>
		</View>
	);
}
