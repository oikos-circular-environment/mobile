import { useLocalSearchParams, useRouter } from "expo-router";
import { PlusIcon, RecycleIcon } from "lucide-react-native";
import { useEffect } from "react";
import { FlatList, View } from "react-native";
import { WasteSkeleton } from "@/components/companies/waste/waste-skeleton";
import { colors } from "@/components/style/colors";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { useCompaniesStore } from "@/stores/companies-store";

export default function WasteIndexScreen() {
	const { companyId } = useLocalSearchParams<{ companyId: string }>();
	const company = useCompaniesStore(s => s.companies.find(c => c.id === companyId));
	const wastes = company?.wastes;
	const isLoadingWastes = useCompaniesStore(s => !s.isLoaded);
	const router = useRouter();

	useEffect(() => {
		if (!isLoadingWastes && wastes && wastes.length === 0) {
			router.replace({
				pathname: "/(tabs)/(home)/companies/[companyId]/waste/form",
				params: { companyId },
			});
		}
	}, [wastes, isLoadingWastes, router, companyId]);

	if (isLoadingWastes) {
		return (
			<View className="flex-1 bg-white p-4">
				<WasteSkeleton />
			</View>
		);
	}

	const handleEdit = (id: string) => {
		router.push({
			pathname: "/(tabs)/(home)/companies/[companyId]/waste/form",
			params: { companyId, id },
		});
	};

	const handleCreate = () => {
		router.push({
			pathname: "/(tabs)/(home)/companies/[companyId]/waste/form",
			params: { companyId },
		});
	};

	return (
		// <ScrollView className="flex-1 bg-white" contentContainerClassName="p-4">
		<FlatList
			data={wastes}
			keyExtractor={item => item.id}
			contentContainerClassName="flex-1 gap-4 p-4 bg-white"
			ListHeaderComponent={
				<Card className="shadow-none ">
					<View className="flex-row items-center justify-between gap-4">
						<View className="size-15 items-center justify-center rounded-lg bg-secondary">
							<RecycleIcon color={colors.lime[800]} size={20} />
						</View>
						<View className="flex-1">
							<Heading className="text-lg">Resíduos</Heading>
							<Text className="text-sm ">
								Gerencie os resíduos que a sua empresa coleta.
							</Text>
						</View>
					</View>

					<Button className="w-full gap-2" onPress={handleCreate}>
						<PlusIcon size={16} color={colors.white} />
						<ButtonText>Novo resíduo</ButtonText>
					</Button>
				</Card>
			}
			renderItem={({ item }) => (
				<Card className="shadow-none p-4 gap-2 border-border/50">
					<View className="flex-row justify-between items-start">
						<View className="flex-1">
							<Heading size="sm">{item.name}</Heading>
							{item.description && (
								<Text
									size="sm"
									className="text-muted-foreground"
									numberOfLines={2}
								>
									{item.description}
								</Text>
							)}
						</View>
						<Text className="font-bold text-primary-600">
							{new Intl.NumberFormat("pt-BR", {
								style: "currency",
								currency: "BRL",
							}).format(item.price)}
						</Text>
					</View>

					<View className="flex-row flex-wrap gap-2 mt-2">
						<View className="bg-secondary/50 px-2 py-1 rounded-md">
							<Text className="text-xs text-secondary-700">{item.unit}</Text>
						</View>
						<View className="bg-primary/10 px-2 py-1 rounded-md">
							<Text className="text-xs text-primary-700">
								{item.waste_category.name}
							</Text>
						</View>
					</View>

					<Button
						variant="outline"
						size="sm"
						className="mt-2"
						onPress={() => handleEdit(item.id)}
					>
						<ButtonText>Editar</ButtonText>
					</Button>
				</Card>
			)}
			ListEmptyComponent={
				<View className="items-center justify-center py-8">
					<Text className="text-muted-foreground">
						Nenhum resíduo cadastrado.
					</Text>
				</View>
			}
		/>
		// </ScrollView>
	);
}
