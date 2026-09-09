import type BottomSheet from "@gorhom/bottom-sheet";
import { formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";
import { router } from "expo-router";
import { ArrowUpRight } from "lucide-react-native";
import { useCallback, useRef } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { CreateSupportBottomSheet } from "@/components/support/create-support-bottom-sheet";
import { useLoadSupportRequests } from "@/components/support/hooks/use-load-support-requests";
import { StatusBadge } from "@/components/support/status-badge";
import { SupportCardSkeleton } from "@/components/support/support-card-skeleton";
import { SupportListHeader } from "@/components/support/support-list-header";
import {
	SupportContextBadge,
	SupportTypeBadge,
} from "@/components/support/type-badge";
import { Button, ButtonText } from "@/components/ui/button";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import type { SupportRequest } from "@/libs/types/support";
import { useRouteInteractive } from "@/libs/use-route-interactive";
import { useSupportStore } from "@/stores/support-store";

export default function SupportListScreen() {
	useRouteInteractive();
	const createSheetRef = useRef<BottomSheet>(null);

	const { isError, isRefetching, refetch } = useLoadSupportRequests();
	const supports = useSupportStore(s => s.supports);
	const isLoading = useSupportStore(s => !s.isLoaded);

	const openCreateSheet = useCallback(
		() => createSheetRef.current?.snapToIndex(0),
		[],
	);

	const renderItem = useCallback(
		({ item }: { item: SupportRequest }) => (
			<Pressable
				className="gap-2 rounded-xl border border-gray-100 p-3"
				onPress={() => router.push(`/(tabs)/(home)/support/${item.id}`)}
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
					<SupportContextBadge />
					<SupportTypeBadge type={item.type} />
					<StatusBadge status={item.status} />
				</View>
			</Pressable>
		),
		[],
	);

	const ListHeader = useCallback(
		() => <SupportListHeader onNewSupport={openCreateSheet} />,
		[openCreateSheet],
	);

	const ListEmpty = useCallback(() => {
		if (isLoading) {
			return (
				<View className="gap-3">
					<SupportCardSkeleton />
					<SupportCardSkeleton />
					<SupportCardSkeleton />
				</View>
			);
		}
		if (isError) {
			return (
				<View className="items-center gap-3">
					<Text className="text-center text-gray-500">
						Não foi possível carregar seus chamados.
					</Text>
					<Button variant="outline" onPress={() => void refetch()}>
						<ButtonText>Tentar novamente</ButtonText>
					</Button>
				</View>
			);
		}
		return (
			<Text className="text-center text-gray-500">
				Você ainda não abriu nenhum chamado de suporte.
			</Text>
		);
	}, [isLoading, isError, refetch]);

	return (
		<View className="flex-1 bg-white">
			<FlatList<SupportRequest>
				data={supports}
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

			<CreateSupportBottomSheet
				ref={createSheetRef}
				onSuccess={() => createSheetRef.current?.close()}
			/>
		</View>
	);
}
