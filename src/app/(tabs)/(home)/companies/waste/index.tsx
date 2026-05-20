import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { useUserCompanyContext } from "@/contexts/user-company-context";
import { PlusIcon } from "lucide-react-native";
import { FlatList, View } from "react-native";
import { useRouter } from "expo-router";
import { WasteSkeleton } from "@/components/companies/waste/waste-skeleton";
import { useEffect } from "react";

export default function WasteIndexScreen() {
	const { wastes, isLoadingWastes } = useUserCompanyContext();
	const router = useRouter();

	useEffect(() => {
		if (!isLoadingWastes && wastes && wastes.length === 0) {
			router.replace("/(tabs)/(home)/companies/waste/form");
		}
	}, [wastes, isLoadingWastes, router]);

	if (isLoadingWastes) {
		return (
			<View className="flex-1 bg-white p-4">
				<WasteSkeleton />
			</View>
		);
	}

	const handleEdit = (id: string) => {
		router.push({
			pathname: "/(tabs)/(home)/companies/waste/form",
			params: { id },
		});
	};

	const handleCreate = () => {
		router.push("/(tabs)/(home)/companies/waste/form");
	};

	return (
		<FlatList
			data={wastes}
			keyExtractor={item => item.id}
			contentContainerClassName="p-4 pb-8 gap-4"
			className="bg-white"
			ListHeaderComponent={
				<View className="gap-4 mb-2">
					<Card className="shadow-none gap-2">
						<Heading size="xl">Resíduos</Heading>
						<Text className="text-muted-foreground">
							Gerencie os resíduos que sua empresa coleta.
						</Text>
					</Card>
					<Button className="w-full gap-2" onPress={handleCreate}>
						<PlusIcon size={16} color="white" />
						<ButtonText>Novo resíduo</ButtonText>
					</Button>
				</View>
			}
			renderItem={({ item }) => (
				<Card className="shadow-none p-4 gap-2 border-border/50">
					<View className="flex-row justify-between items-start">
						<View className="flex-1">
							<Heading size="sm">{item.name}</Heading>
							{item.description ? (
								<Text size="sm" className="text-muted-foreground" numberOfLines={2}>
									{item.description}
								</Text>
							) : null}
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
							<Text className="text-xs text-secondary-700">
								{item.unit}
							</Text>
						</View>
						<View className="bg-primary/10 px-2 py-1 rounded-md">
							<Text className="text-xs text-primary-700">
								{item.waste_type === "RECYCLABLE" ? "Reciclável" : "Rejeito"}
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
					<Text className="text-muted-foreground">Nenhum resíduo cadastrado.</Text>
				</View>
			}
		/>
	);
}
