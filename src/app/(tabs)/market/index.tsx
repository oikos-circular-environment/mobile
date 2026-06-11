import { Link } from "expo-router";
import { Sprout } from "lucide-react-native";
import { useMemo, useRef } from "react";
import {
	FlatList,
	Image,
	KeyboardAvoidingView,
	Pressable,
	View,
} from "react-native";
import {
	FiltersBottomSheet,
	type FiltersBottomSheetRef,
} from "@/components/market/filters-bottom-sheet";
import { MarketListHeader } from "@/components/market/list-header-market";
import {
	type LocationSheetRef,
	LocationSourceSelect,
} from "@/components/market/location-source-select";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Grid, GridItem } from "@/components/ui/grid";
import { HStack } from "@/components/ui/hstack";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { useGeospatial } from "@/contexts/geospatial-context";
import { useMarket } from "@/contexts/market-context";
import { isCompanyOpenNow } from "@/libs/market/is-company-open";
import type { MarketCompany } from "@/libs/types/market";

const formatDistance = (meters: number) => {
	if (meters >= 1000) {
		return `${(meters / 1000).toFixed(1).replace(".", ",")} km`;
	}
	return `${Math.round(meters)} m`;
};

function CompanyCardItem({
	company,
	currentDate,
}: {
	company: MarketCompany;
	currentDate: Date;
}) {
	const isOpen = isCompanyOpenNow(company.business_hours, currentDate);
	const initials = company.business_name
		.split(" ")
		.slice(0, 2)
		.map(w => w[0]?.toUpperCase() ?? "")
		.join("");

	return (
		<Link
			href={{
				pathname: "/market/[companyId]",
				params: { companyId: company.id },
			}}
			asChild
		>
			<Pressable>
				<Card className="gap-0 p-0 overflow-hidden rounded-xl border border-border shadow-none">
					<View className="h-[92px] bg-primary/10 items-center justify-center">
						{company.avatar ? (
							<View className="w-11 h-11 rounded-lg overflow-hidden">
								<Image
									source={{ uri: company.avatar }}
									className="w-full h-full"
									resizeMode="cover"
								/>
							</View>
						) : (
							<View className="w-11 h-11 rounded-lg bg-primary items-center justify-center">
								{company.company_type === "COLLECTOR" ? (
									<Sprout size={20} className="text-primary-foreground" />
								) : (
									<Text className="text-primary-foreground text-sm font-bold">
										{initials}
									</Text>
								)}
							</View>
						)}
					</View>

					<View className="px-3 pt-2.5 pb-3 gap-1">
						<Text className="font-bold uppercase truncate">
							{company.business_name}
						</Text>
						<Text
							className="text-xs text-muted-foreground truncate"
							numberOfLines={1}
						>
							{company.wastes
								.map(w => w.name)
								.slice(0, 4)
								.join(", ")}
						</Text>
						<HStack className="gap-1.5 pt-1 flex-wrap">
							<Badge variant="secondary">
								<BadgeText>
									{formatDistance(company.distance_in_meters)}
								</BadgeText>
							</Badge>
							{company.company_type === "COLLECTOR" && (
								<Badge variant="default">
									<BadgeText>Coletor</BadgeText>
								</Badge>
							)}
							<Badge variant={isOpen ? "default" : "destructive"}>
								<BadgeText>{isOpen ? "Aberto" : "Fechado"}</BadgeText>
							</Badge>
						</HStack>
					</View>
				</Card>
			</Pressable>
		</Link>
	);
}

export default function MarketScreen() {
	const { currentDate } = useGeospatial();
	const {
		locationSource,
		isLocationReady,
		isResolvingLocation,
		companies,
		isPending,
		isFetchingNextPage,
		hasNextPage,
		fetchNextPage,
		isError,
	} = useMarket();

	const locationSheetRef = useRef<LocationSheetRef>(null);
	const filtersSheetRef = useRef<FiltersBottomSheetRef>(null);

	const rows = useMemo(() => {
		const chunked: MarketCompany[][] = [];
		for (let i = 0; i < companies.length; i += 2) {
			chunked.push(companies.slice(i, i + 2));
		}
		return chunked;
	}, [companies]);

	const ListFooter = useMemo(
		() =>
			hasNextPage ? (
				<Pressable
					className="items-center py-3"
					onPress={() => fetchNextPage()}
					disabled={isFetchingNextPage}
				>
					{isFetchingNextPage ? (
						<Spinner className="text-primary" />
					) : (
						<Text className="text-sm font-semibold text-primary">
							Carregar mais
						</Text>
					)}
				</Pressable>
			) : null,
		[hasNextPage, isFetchingNextPage, fetchNextPage],
	);

	return (
		<KeyboardAvoidingView
			behavior={process.env.EXPO_OS === "ios" ? "padding" : "height"}
			className="flex-1 bg-background"
		>
			{!isLocationReady ? (
				isResolvingLocation ? (
					<View className="flex-1 items-center justify-center p-6">
						<Spinner className="text-primary" />
						<Text className="mt-2 text-sm text-muted-foreground">
							Obtendo localização…
						</Text>
					</View>
				) : (
					<View className="flex-1 p-4 gap-1">
						<Text className="text-sm font-semibold text-foreground">
							{locationSource === "current"
								? "Localização indisponível"
								: "Endereço não configurado"}
						</Text>
						<Text className="text-xs text-muted-foreground">
							{locationSource === "current"
								? "Permita o acesso à localização nas configurações do dispositivo."
								: "Adicione um endereço no seu perfil para ver empresas próximas a você."}
						</Text>
					</View>
				)
			) : (
				<>
					<FlatList
						data={rows}
						keyExtractor={(_, index) => String(index)}
						contentContainerClassName="px-4 pb-8"
						ListHeaderComponent={
							<MarketListHeader
								filtersSheetRef={filtersSheetRef}
								locationSheetRef={locationSheetRef}
							/>
						}
						renderItem={({ item: row }) => (
							<Grid
								_extra={{ className: "grid-cols-2" }}
								className="gap-3 mb-3"
							>
								{row.map(company => (
									<GridItem
										key={company.id}
										_extra={{ className: "col-span-1" }}
									>
										<CompanyCardItem
											company={company}
											currentDate={currentDate}
										/>
									</GridItem>
								))}
								{row.length < 2 && (
									<GridItem _extra={{ className: "col-span-1" }} />
								)}
							</Grid>
						)}
						ListFooterComponent={ListFooter}
						ListEmptyComponent={
							isPending ? (
								<View className="items-center p-6">
									<Spinner className="text-primary" />
									<Text className="mt-2 text-sm text-muted-foreground">
										Buscando empresas…
									</Text>
								</View>
							) : isError ? (
								<View className="p-4 gap-1">
									<Text className="text-sm font-semibold text-foreground">
										Erro ao carregar
									</Text>
									<Text className="text-xs text-muted-foreground">
										Não foi possível buscar as empresas. Tente novamente.
									</Text>
								</View>
							) : (
								<View className="p-4">
									<Text className="text-sm text-muted-foreground">
										Nenhuma empresa encontrada para os filtros aplicados.
									</Text>
								</View>
							)
						}
					/>

					<LocationSourceSelect ref={locationSheetRef} hideTrigger />
					<FiltersBottomSheet ref={filtersSheetRef} />
				</>
			)}
		</KeyboardAvoidingView>
	);
}
