import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { BuildingIcon, PlusIcon } from "lucide-react-native";
import { FlatList, Pressable, View } from "react-native";
import { colors } from "@/components/style/colors";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { getV1Companies } from "@/libs/oikos-sdk";
import { companyTypeOptions } from "@/libs/types/companies";

function CompanyTypeBadge({ type }: { type: string }) {
	const label = companyTypeOptions.find(o => o.value === type)?.label ?? type;
	return (
		<View className="bg-primary/10 px-2 py-0.5 rounded-md self-start">
			<Text className="text-xs text-primary">{label}</Text>
		</View>
	);
}

export default function CompaniesListScreen() {
	const router = useRouter();

	const { data, isLoading } = useQuery({
		queryKey: ["companies"],
		queryFn: async () => {
			const res = await getV1Companies();
			return res.data;
		},
	});

	const companies = data?.companies ?? [];

	const handleCreate = () => {
		router.push("/(tabs)/(home)/companies/create");
	};

	const handleSelectCompany = (companyId: string) => {
		router.push({
			pathname: "/(tabs)/(home)/companies/[companyId]",
			params: { companyId },
		});
	};

	if (isLoading) {
		return (
			<View className="flex-1 bg-white items-center justify-center">
				<Spinner />
			</View>
		);
	}

	return (
		<FlatList
			data={companies}
			keyExtractor={item => item.id}
			className="flex-1 bg-white"
			contentContainerClassName="px-4 pb-8 pt-10 gap-3"
			ListHeaderComponent={
				<View className="gap-4 mb-2">
					<View className="flex-row items-center justify-between">
						<Heading className="text-xl">Minhas Empresas</Heading>
						<Button size="sm" className="gap-1" onPress={handleCreate}>
							<PlusIcon size={14} color={colors.white} />
							<ButtonText>Nova</ButtonText>
						</Button>
					</View>
					<Text className="text-sm text-muted-foreground">
						Selecione uma empresa para gerenciar suas configurações.
					</Text>
				</View>
			}
			renderItem={({ item }) => (
				<Pressable onPress={() => handleSelectCompany(item.id)}>
					<Card className="shadow-none">
						<View className="flex-row items-center gap-3">
							{item.avatar ? (
								<Image
									source={{ uri: item.avatar.url }}
									className="size-12 rounded-full"
									contentFit="cover"
								/>
							) : (
								<View className="size-12 rounded-full bg-secondary items-center justify-center">
									<BuildingIcon size={22} className="text-muted-foreground" />
								</View>
							)}

							<View className="flex-1 gap-1">
								<Text className="font-semibold text-base" numberOfLines={1}>
									{item.business_name ?? item.corporate_name}
								</Text>
								{item.business_name ? (
									<Text
										className="text-xs text-muted-foreground"
										numberOfLines={1}
									>
										{item.corporate_name}
									</Text>
								) : null}
								<CompanyTypeBadge type={item.company_type} />
							</View>
						</View>
					</Card>
				</Pressable>
			)}
			ListEmptyComponent={
				<View className="flex-1 items-center justify-center py-20 gap-4">
					<View className="size-16 rounded-full bg-secondary items-center justify-center">
						<BuildingIcon size={28} className="text-muted-foreground" />
					</View>
					<View className="items-center gap-1">
						<Heading className="text-base">Nenhuma empresa cadastrada</Heading>
						<Text className="text-sm text-muted-foreground text-center">
							Cadastre sua empresa para começar a usar a plataforma.
						</Text>
					</View>
					<Button onPress={handleCreate} className="gap-2">
						<PlusIcon size={16} color={colors.white} />
						<ButtonText>Cadastrar empresa</ButtonText>
					</Button>
				</View>
			}
		/>
	);
}
