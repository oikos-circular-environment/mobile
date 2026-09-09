import type BottomSheet from "@gorhom/bottom-sheet";
import { formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";
import { router } from "expo-router";
import { ArrowUpRight } from "lucide-react-native";
import { useCallback, useRef } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { CreateDenunciationBottomSheet } from "@/components/denunciation/create-denunciation-bottom-sheet";
import { DenunciationCardSkeleton } from "@/components/denunciation/denunciation-card-skeleton";
import { DenunciationListHeader } from "@/components/denunciation/denunciation-list-header";
import { useLoadDenunciations } from "@/components/denunciation/hooks/use-load-denunciations";
import {
	DenunciationContextBadge,
	DenunciationSeverityBadge,
} from "@/components/denunciation/severity-badge";
import { DenunciationStatusBadge } from "@/components/denunciation/status-badge";
import { Button, ButtonText } from "@/components/ui/button";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import type { Denunciation } from "@/libs/types/denunciation";
import { useRouteInteractive } from "@/libs/use-route-interactive";
import { useDenunciationStore } from "@/stores/denunciation-store";

export default function DenunciationListScreen() {
	useRouteInteractive();
	const createSheetRef = useRef<BottomSheet>(null);

	const { isError, isRefetching, refetch } = useLoadDenunciations();
	const denunciations = useDenunciationStore(s => s.denunciations);
	const isLoading = useDenunciationStore(s => !s.isLoaded);

	const openCreateSheet = useCallback(
		() => createSheetRef.current?.snapToIndex(0),
		[],
	);

	const renderItem = useCallback(
		({ item }: { item: Denunciation }) => (
			<Pressable
				className="gap-2 rounded-xl border border-gray-100 p-3"
				onPress={() => router.push(`/(tabs)/(home)/denunciation/${item.id}`)}
			>
				<View className="flex-row items-center justify-between">
					<Text className="text-xs text-gray-400">
						{formatDistanceToNowStrict(item.created_at, {
							locale: ptBR,
							addSuffix: true,
						})}
					</Text>
					<ArrowUpRight size={16} color="#9ca3af" />
				</View>
				<Text className="font-semibold text-gray-900">{item.title}</Text>
				<Text numberOfLines={2} className="text-sm text-gray-500">
					{item.description}
				</Text>
				<View className="flex-row items-center gap-2">
					<DenunciationContextBadge />
					<DenunciationSeverityBadge severity={item.severity} />
					<DenunciationStatusBadge status={item.status} />
				</View>
			</Pressable>
		),
		[],
	);

	const ListHeader = useCallback(
		() => <DenunciationListHeader onNewDenunciation={openCreateSheet} />,
		[openCreateSheet],
	);

	const ListEmpty = useCallback(() => {
		if (isLoading) {
			return (
				<View className="gap-3">
					<DenunciationCardSkeleton />
					<DenunciationCardSkeleton />
					<DenunciationCardSkeleton />
				</View>
			);
		}
		if (isError) {
			return (
				<View className="items-center gap-3">
					<Text className="text-center text-gray-500">
						Não foi possível carregar suas denúncias.
					</Text>
					<Button variant="outline" onPress={() => void refetch()}>
						<ButtonText>Tentar novamente</ButtonText>
					</Button>
				</View>
			);
		}
		return (
			<Text className="text-center text-gray-500">
				Você ainda não abriu nenhuma denúncia.
			</Text>
		);
	}, [isLoading, isError, refetch]);

	return (
		<View className="flex-1 bg-white">
			<FlatList<Denunciation>
				data={denunciations}
				keyExtractor={item => item.id}
				contentContainerClassName="p-4 gap-3"
				refreshControl={
					<RefreshControl
						refreshing={isRefetching}
						onRefresh={() => void refetch()}
					/>
				}
				ListHeaderComponent={ListHeader}
				ListEmptyComponent={ListEmpty}
				renderItem={renderItem}
			/>

			<CreateDenunciationBottomSheet
				ref={createSheetRef}
				onSuccess={() => createSheetRef.current?.close()}
			/>
		</View>
	);
}
