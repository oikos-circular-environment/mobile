import BottomSheet, {
	BottomSheetFlatList,
} from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import type { MapComplaint } from "@/libs/types/complaint";
import { useComplaintsStore } from "@/stores/complaints-store";
import { ComplaintMapListItem } from "./complaint-map-list-item";

type Props = {
	complaints: MapComplaint[];
	userLocation: { lat: number; lon: number } | null;
	onSelectComplaint: (complaint: MapComplaint) => void;
};

export function ComplaintsListBottomSheet({
	complaints,
	userLocation,
	onSelectComplaint,
}: Props) {
	const ref = useRef<BottomSheet>(null);
	const snapPoints = useMemo(() => ["15%", "42%"], []);
	const selectedMapComplaint = useComplaintsStore(s => s.selectedMapComplaint);

	useEffect(() => {
		if (selectedMapComplaint) {
			ref.current?.snapToIndex(0);
		} else {
			ref.current?.snapToIndex(1);
		}
	}, [selectedMapComplaint]);

	const renderItem = useCallback(
		({ item }: { item: MapComplaint }) => (
			<ComplaintMapListItem
				complaint={item}
				userLocation={userLocation}
				isSelected={selectedMapComplaint?.id === item.id}
				onPress={onSelectComplaint}
			/>
		),
		[userLocation, onSelectComplaint, selectedMapComplaint],
	);

	const keyExtractor = useCallback((item: MapComplaint) => item.id, []);

	const ListHeaderComponent = useCallback(
		() => (
			<View className="px-4 pb-2 pt-1">
				<Text className="text-xs font-medium text-gray-500">
					{complaints.length}{" "}
					{complaints.length === 1
						? "denúncia encontrada"
						: "denúncias encontradas"}
				</Text>
			</View>
		),
		[complaints.length],
	);

	const ListEmptyComponent = useCallback(
		() => (
			<View className="items-center px-4 py-8">
				<Text className="text-center text-sm text-gray-400">
					Nenhuma denúncia encontrada nesta área.
				</Text>
			</View>
		),
		[],
	);

	const ItemSeparatorComponent = useCallback(
		() => <View className="mx-4 h-px bg-gray-100" />,
		[],
	);

	return (
		<BottomSheet
			ref={ref}
			index={1}
			snapPoints={snapPoints}
			enablePanDownToClose={false}
			handleIndicatorStyle={{ backgroundColor: "#d1d5db", width: 40 }}
		>
			<BottomSheetFlatList
				data={complaints}
				keyExtractor={keyExtractor}
				renderItem={renderItem}
				ListHeaderComponent={ListHeaderComponent}
				ListEmptyComponent={ListEmptyComponent}
				ItemSeparatorComponent={ItemSeparatorComponent}
				contentContainerStyle={{ paddingBottom: 16 }}
			/>
		</BottomSheet>
	);
}
