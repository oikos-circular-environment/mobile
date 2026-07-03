import { Redirect, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeftIcon, PlusIcon, RecycleIcon } from "lucide-react-native";
import { FlatList, View } from "react-native";
import { useSaveWastes } from "@/components/companies/hooks/use-save-wastes";
import { WasteSkeleton } from "@/components/companies/waste/waste-skeleton";
import {
	type HazardLevelVariant,
	WasteCategoryHazardLevel,
} from "@/components/custom/waste-category";
import { colors } from "@/components/style/colors";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { SwipeableCard } from "@/components/ui/swipeable-card";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useCompaniesStore } from "@/stores/companies-store";

export default function WasteIndexScreen() {
	const { companyId } = useLocalSearchParams<{ companyId: string }>();
	const company = useCompaniesStore(s =>
		s.companies.find(c => c.id === companyId),
	);
	const wastes = company?.wastes;
	const isLoadingWastes = useCompaniesStore(s => !s.isLoaded);
	const router = useRouter();

	const { mutateAsync: saveWastes } = useSaveWastes(companyId);

	if (isLoadingWastes) {
		return (
			<View className="flex-1 bg-white p-4">
				<WasteSkeleton />
			</View>
		);
	}

	if (wastes?.length === 0) {
		return (
			<Redirect
				href={{
					pathname: "/(tabs)/(home)/companies/[companyId]/waste/form",
					params: { companyId },
				}}
			/>
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

	const handleDelete = async (id: string) => {
		const remaining = (wastes ?? [])
			.filter(w => w.id !== id)
			.map(w => ({
				name: w.name,
				description: w.description ?? null,
				price: w.price,
				unit: w.unit,
				quantity: w.quantity,
				waste_category_id: w.waste_category_id,
				observations: w.observations ?? null,
			}));
		await saveWastes({ wastes: remaining });
	};

	return (
		<>
			<Stack.Screen
				options={{
					headerLeft: () => (
						<Pressable
							onPress={() => router.back()}
							className="flex-row justify-center items-center"
						>
							<ChevronLeftIcon size={24} className="text-foreground" />
						</Pressable>
					),
				}}
			/>
			<FlatList
				data={wastes}
				keyExtractor={item => item.id}
				contentContainerClassName="flex-1 gap-4 p-4 bg-white"
				ListHeaderComponent={
					<VStack space="md">
						<Card className="bg-gray-100 p-4 shadow-none">
							<View className="flex-row items-center gap-4">
								<View className="flex-1 gap-1">
									<Heading>Resíduos</Heading>
									<Text className="text-sm text-gray-500" selectable>
										Gerencie os resíduos que a sua empresa coleta.
									</Text>
								</View>

								<View className="size-14 items-center justify-center rounded-lg bg-lime-800">
									<RecycleIcon
										size={24}
										color={colors.white}
										strokeWidth={2.25}
									/>
								</View>
							</View>
						</Card>

						<Button
							testID="btn-new"
							className="w-full gap-2"
							onPress={handleCreate}
						>
							<PlusIcon size={16} color={colors.white} />
							<ButtonText>Novo resíduo</ButtonText>
						</Button>

						<VStack>
							<Heading size="md">Meus resíduos</Heading>
							<Text size="sm" className="text-muted-foreground">
								Clique sobre o resíduo para editar, arraste da direta para
								esquerda para deletar
							</Text>
						</VStack>
					</VStack>
				}
				renderItem={({ item }) => (
					<SwipeableCard
						onPress={() => handleEdit(item.id)}
						onDelete={() => handleDelete(item.id)}
					>
						<Card className="shadow-none gap-2">
							<VStack space="sm">
								<HStack className="justify-between">
									<Heading size="sm">{item.name}</Heading>
									<Text className="font-bold text-primary-600">
										{new Intl.NumberFormat("pt-BR", {
											style: "currency",
											currency: "BRL",
										}).format(item.price)}
										<Text size="xs" className="text-muted-foreground">
											/{item.unit}
										</Text>
									</Text>
								</HStack>
								{item.description && (
									<Text
										size="sm"
										className="text-muted-foreground text-justify"
										numberOfLines={2}
									>
										{item.description}
									</Text>
								)}
								<View className="flex-row flex-wrap gap-2 mt-2">
									<Badge variant="secondary">
										<BadgeText>{item.unit}</BadgeText>
									</Badge>
									<Badge variant="secondary">
										<BadgeText>{item.waste_category.name}</BadgeText>
									</Badge>

									{item.waste_category.hazard_levels.map(hazard_level => (
										<WasteCategoryHazardLevel
											key={`${item.id}-${hazard_level}`}
											variant={hazard_level.toLowerCase() as HazardLevelVariant}
										/>
									))}
								</View>
							</VStack>
						</Card>
					</SwipeableCard>
				)}
				ListEmptyComponent={
					<View className="items-center justify-center py-8">
						<Text className="text-muted-foreground">
							Nenhum resíduo cadastrado.
						</Text>
					</View>
				}
			/>
		</>
	);
}
