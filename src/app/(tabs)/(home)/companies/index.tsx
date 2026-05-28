import { useQuery } from "@tanstack/react-query";
import { useFocusEffect, useRouter } from "expo-router";
import { BuildingIcon } from "lucide-react-native";
import { useCallback } from "react";
import { FlatList, View } from "react-native";
import { CompanyCard, CompanyCardSkeleton } from "@/components/companies/company-card";
import { CompanyListHeader } from "@/components/companies/company-list-header";
import { colors } from "@/components/style/colors";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { getV1Companies } from "@/libs/oikos-sdk";

type Company = Awaited<
	ReturnType<typeof getV1Companies>
>["data"]["companies"][number];

export default function CompaniesListScreen() {
	const router = useRouter();

	const { data, isLoading, refetch } = useQuery({
		queryKey: ["companies"],
		queryFn: async () => {
			const res = await getV1Companies();
			return res.data;
		},
	});

	const companies = data?.companies ?? [];

	useFocusEffect(
		useCallback(() => {
			refetch();
		}, [refetch]),
	);

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
			<CompanyCard company={item} onPress={() => handleSelectCompany(item.id)} />
		),
		[handleSelectCompany],
	);

	const ListEmpty = useCallback(() => {
		if (isLoading) {
			return (
				<View className="gap-4">
					<CompanyCardSkeleton />
					<CompanyCardSkeleton />
					<CompanyCardSkeleton />
				</View>
			);
		}
		return (
			<Card className="items-center gap-2 border-gray-100 p-6 shadow-none">
				<BuildingIcon size={32} color={colors.gray[400]} strokeWidth={1.5} />
				<Text className="text-center text-sm text-gray-500">
					Nenhuma empresa cadastrada.
				</Text>
			</Card>
		);
	}, [isLoading]);

	return (
		<View className="flex-1 bg-white">
			<FlatList<Company>
				data={companies}
				keyExtractor={item => item.id}
				contentContainerClassName="gap-4 px-4 py-4 pb-8"
				ListHeaderComponent={CompanyListHeader}
				renderItem={renderItem}
				ListEmptyComponent={ListEmpty}
			/>
		</View>
	);
}
