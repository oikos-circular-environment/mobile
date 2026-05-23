"use client";

import { router, useFocusEffect } from "expo-router";
import { Plus, ShieldIcon } from "lucide-react-native";
import { useCallback } from "react";
import { FlatList, View } from "react-native";
import {
	ComplaintCard,
	ComplaintCardSkeleton,
} from "@/components/complaints/complaint-card";
import { ComplaintPainel } from "@/components/complaints/complaint-painel";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import type { ApiComplaint } from "@/contexts/complaints-context";
import { useComplaintsContext } from "@/contexts/complaints-context";

function ListHeader() {
	return (
		<View className="gap-4">
			<Card className="bg-gray-100 p-4 shadow-none">
				<View className="flex-row items-center gap-4">
					<View className="flex-1 gap-1">
						<Heading>Denunciar</Heading>
						<Text className="text-sm text-gray-500" selectable>
							Faça a sua denúncia anônima e gratuita. Ajude a manter o meio
							ambiente livre do descarte irregular.
						</Text>
					</View>

					<View className="size-14 items-center justify-center rounded-lg bg-lime-800">
						<ShieldIcon size={24} color="#FFFFFF" strokeWidth={2.25} />
					</View>
				</View>
			</Card>

			<Button
				size="lg"
				onPress={() => router.push("/(tabs)/complaints/(create)/camera")}
			>
				<ButtonText className="flex-1 text-center font-semibold text-white">
					Nova Denúncia
				</ButtonText>
				<ButtonIcon as={Plus} className="text-white" height={18} width={18} />
			</Button>

			<View className="justify-center">
				<Heading>Dashboard</Heading>
				<Text>
					Os campos abaixo servem como filtros, clique sobre eles para filtrar
					sua lista.
				</Text>
			</View>

			<ComplaintPainel />

			<View>
				<Heading>Denúncias</Heading>
			</View>
		</View>
	);
}

export default function ComplaintsScreen() {
	const {
		filteredComplaints,
		isLoadingComplaints,
		refetchAll,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useComplaintsContext();

	useFocusEffect(
		useCallback(() => {
			refetchAll();
		}, [refetchAll]),
	);

	const renderItem = useCallback(
		({ item }: { item: ApiComplaint }) => <ComplaintCard complaint={item} />,
		[],
	);

	const ListEmpty = useCallback(() => {
		if (isLoadingComplaints) {
			return (
				<View className="gap-4">
					<ComplaintCardSkeleton />
					<ComplaintCardSkeleton />
					<ComplaintCardSkeleton />
				</View>
			);
		}
		return (
			<Card className="items-center gap-2 border-gray-100 p-6 shadow-none">
				<ShieldIcon size={32} color="#9CA3AF" strokeWidth={1.5} />
				<Text className="text-center text-sm text-gray-500">
					Nenhuma denúncia encontrada.
				</Text>
			</Card>
		);
	}, [isLoadingComplaints]);

	const ListFooter = useCallback(() => {
		if (!isFetchingNextPage) return null;
		return (
			<View className="items-center py-4">
				<Spinner />
			</View>
		);
	}, [isFetchingNextPage]);

	const handleEndReached = useCallback(() => {
		if (hasNextPage && !isFetchingNextPage) {
			fetchNextPage();
		}
	}, [hasNextPage, isFetchingNextPage, fetchNextPage]);

	return (
		<FlatList<ApiComplaint>
			className="flex-1 bg-white"
			contentContainerClassName="gap-4 px-4 py-4 pb-8"
			data={filteredComplaints}
			keyExtractor={item => item.id}
			renderItem={renderItem}
			ListHeaderComponent={ListHeader}
			ListEmptyComponent={ListEmpty}
			ListFooterComponent={ListFooter}
			onEndReached={handleEndReached}
			onEndReachedThreshold={0.3}
		/>
	);
}
