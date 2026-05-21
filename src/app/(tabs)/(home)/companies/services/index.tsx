import { useRouter } from "expo-router";
import { PlusIcon, WrenchIcon } from "lucide-react-native";
import { useEffect } from "react";
import { FlatList, ScrollView, View } from "react-native";
import { ServiceSkeleton } from "@/components/companies/services/service-skeleton";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { useUserCompanyContext } from "@/contexts/user-company-context";

export default function ServicesIndexScreen() {
	const { services, isLoadingServices } = useUserCompanyContext();
	const router = useRouter();

	useEffect(() => {
		if (!isLoadingServices && services && services.length === 0) {
			router.replace("/(tabs)/(home)/companies/services/form");
		}
	}, [services, isLoadingServices, router]);

	if (isLoadingServices) {
		return (
			<View className="flex-1 bg-white p-4">
				<ServiceSkeleton />
			</View>
		);
	}

	const handleEdit = (id: string) => {
		router.push({
			pathname: "/(tabs)/(home)/companies/services/form",
			params: { id },
		});
	};

	const handleCreate = () => {
		router.push("/(tabs)/(home)/companies/services/form");
	};

	return (
		<ScrollView className="flex-1 bg-white" contentContainerClassName="p-4">
			<FlatList
				data={services}
				keyExtractor={item => item.id}
				contentContainerClassName="gap-4"
				className="bg-white"
				ListHeaderComponent={
					<Card className="shadow-none ">
						<View className="flex-row items-center justify-between gap-4">
							<View className="size-15 items-center justify-center rounded-lg bg-secondary">
								<WrenchIcon color="#3d6300" size={20} />
							</View>
							<View className="flex-1">
								<Heading className="text-lg">Serviços</Heading>
								<Text className="text-sm ">
									Gerencie seus serviços, você pode criar, editar ou deletar da
									maneira que quiser.
								</Text>
							</View>
						</View>

						<Button className="w-full gap-2" onPress={handleCreate}>
							<PlusIcon size={16} color="white" />
							<ButtonText>Novo serviço</ButtonText>
						</Button>
					</Card>
				}
				renderItem={({ item }) => (
					<Card className="shadow-none p-4 gap-2 border-border/50">
						<View className="flex-row justify-between items-start">
							<View className="flex-1">
								<Heading size="sm">{item.name}</Heading>
								{item.description ? (
									<Text
										size="sm"
										className="text-muted-foreground"
										numberOfLines={2}
									>
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
									{item.quantity} {item.unit}
								</Text>
							</View>
							<View className="bg-primary/10 px-2 py-1 rounded-md">
								<Text className="text-xs text-primary-700">
									{item.waste_type === "RECYCLABLE" ? "Reciclável" : "Resíduo"}
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
							Nenhum serviço cadastrado.
						</Text>
					</View>
				}
			/>
		</ScrollView>
	);
}
