import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { BuildingIcon, PlusIcon } from "lucide-react-native";
import { useCallback } from "react";
import { FlatList, Pressable, View } from "react-native";
import { colors } from "@/components/style/colors";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { getV1Companies } from "@/libs/oikos-sdk";
import { companyTypeOptions } from "@/libs/types/companies";

type Company = Awaited<
	ReturnType<typeof getV1Companies>
>["data"]["companies"][number];

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

	const handleCreate = useCallback(() => {
		router.push({
			pathname: "/(tabs)/(home)/companies/[companyId]/company",
			params: { companyId: "new-company" },
		});
	}, [router]);

	const handleSelectCompany = useCallback(
		(companyId: string) => {
			router.push({
				pathname: "/(tabs)/(home)/companies/[companyId]",
				params: { companyId },
			});
		},
		[router],
	);

	const renderItem = useCallback(
		({ item }: { item: Company }) => (
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
		),
		[handleSelectCompany],
	);

	const ListEmpty = useCallback(() => {
		if (isLoading) {
			return (
				<View className="items-center py-8">
					<Spinner />
				</View>
			);
		}
		return (
			<Card className="items-center gap-3 border-gray-100 p-6 shadow-none">
				<BuildingIcon size={32} color={colors.gray[400]} strokeWidth={1.5} />
				<View className="items-center gap-1">
					<Text className="font-semibold text-center">
						Nenhuma empresa cadastrada
					</Text>
					<Text className="text-sm text-muted-foreground text-center">
						Cadastre sua empresa para começar a usar a plataforma.
					</Text>
				</View>
				<Button onPress={handleCreate} className="gap-2">
					<PlusIcon size={16} color={colors.white} />
					<ButtonText>Cadastrar empresa</ButtonText>
				</Button>
			</Card>
		);
	}, [isLoading, handleCreate]);

	const ListHeader = useCallback(
		() => (
			<View className="flex-row items-center justify-between">
				<Heading className="text-xl">Minhas Empresas</Heading>
				<Button size="sm" className="gap-1" onPress={handleCreate}>
					<PlusIcon size={14} color={colors.white} />
					<ButtonText>Nova</ButtonText>
				</Button>
			</View>
		),
		[handleCreate],
	);

	return (
		<View className="flex-1 bg-white">
			<FlatList
				data={companies}
				keyExtractor={item => item.id}
				contentContainerClassName="gap-4 px-4 py-4 pb-8"
				ListHeaderComponent={ListHeader}
				renderItem={renderItem}
				ListEmptyComponent={ListEmpty}
			/>
		</View>
	);
}
