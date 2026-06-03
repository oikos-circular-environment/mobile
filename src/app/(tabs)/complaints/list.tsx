import { useFocusEffect } from "expo-router";
import { ShieldIcon } from "lucide-react-native";
import { useCallback } from "react";
import { FlatList, View } from "react-native";
import { ComplaintCard } from "@/components/complaints/complaint-card";
import { ComplaintCardSkeleton } from "@/components/complaints/complaint-card-skeleton";
import { ComplaintListHeader } from "@/components/complaints/complaint-list-header";
import { useComplaintsList } from "@/components/complaints/hooks/use-complaints-list";
import { colors } from "@/components/style/colors";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { useShallow } from "zustand/react/shallow";
import {
	type ApiComplaint,
	selectFilteredComplaints,
	useComplaintsStore,
} from "@/stores/complaints-store";

export default function ComplaintsScreen() {
	const filteredComplaints = useComplaintsStore(useShallow(selectFilteredComplaints));
	const {
		isLoadingComplaints,
		refetchAll,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useComplaintsList();

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
				<ShieldIcon size={32} color={colors.gray[400]} strokeWidth={1.5} />
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
		<View className="flex-1 bg-white">
			<FlatList<ApiComplaint>
				contentContainerClassName="gap-4 px-4 py-4 pb-8"
				data={filteredComplaints}
				keyExtractor={item => item.id}
				renderItem={renderItem}
				ListHeaderComponent={ComplaintListHeader}
				ListEmptyComponent={ListEmpty}
				ListFooterComponent={ListFooter}
				onEndReached={handleEndReached}
				onEndReachedThreshold={0.3}
			/>
		</View>
	);
}
