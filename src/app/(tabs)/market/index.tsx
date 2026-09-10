import { Link } from "expo-router";
import { HammerIcon, RecycleIcon, Sprout } from "lucide-react-native";
import { useMemo } from "react";
import {
	FlatList,
	KeyboardAvoidingView,
	Pressable,
	ScrollView,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LocationPermissionAlert } from "@/components/location-permission-alert";
import { LocationSourceBottomSheet } from "@/components/market/location-source-bottom-sheet";
import { MarketListHeader } from "@/components/market/market-list-header";
import { RadiusBottomSheet } from "@/components/market/radius-bottom-sheet";
import { colors } from "@/components/style/colors";
import { TestingWarningAlert } from "@/components/testing-warning-alert";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { HStack } from "@/components/ui/hstack";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useNow } from "@/contexts/clock-context";
import { useGeospatial } from "@/contexts/geospatial-context";
import { useMarket } from "@/contexts/market-context";
import { useRouteInteractive } from "@/hooks/use-route-interactive";
import { getAuthenticatedImageHeaders } from "@/libs/api/oikos-api";
import { formatDistance } from "@/libs/format-distance";
import { isCompanyOpenNow } from "@/libs/market/is-company-open";
import { maskCnpj } from "@/libs/mask";
import type { MarketCompany } from "@/libs/types/market";

function CompanyCardSkeleton() {
	return (
		<Card className="shadow-none p-4">
			<VStack space="md">
				<HStack space="md" className="items-center">
					<Skeleton className="w-16 h-16 rounded-lg" />
					<View className="flex-1 gap-2">
						<Skeleton className="h-4 w-3/4 rounded-sm" />
						<Skeleton className="h-3 w-1/2 rounded-sm" />
						<HStack className="gap-1.5 pt-1">
							<Skeleton className="h-5 w-16 rounded-full" />
							<Skeleton className="h-5 w-12 rounded-full" />
						</HStack>
					</View>
				</HStack>
				<HStack className="gap-2">
					<Skeleton className="h-6 w-20 rounded-full" />
					<Skeleton className="h-6 w-24 rounded-full" />
					<Skeleton className="h-6 w-16 rounded-full" />
				</HStack>
			</VStack>
		</Card>
	);
}

function CompanyCardItem({
	company,
	currentDate,
}: {
	company: MarketCompany;
	currentDate: Date;
}) {
	const { appliedFilters } = useMarket();
	const isOpen = isCompanyOpenNow(company.business_hours, currentDate);
	const initials = company.business_name
		.split(" ")
		.slice(0, 2)
		.map(w => w[0]?.toUpperCase() ?? "")
		.join("");

	return (
		<Card className="shadow-none p-4">
			<VStack space="md">
				<Link
					href={{
						pathname: "/market/[companyId]",
						params: { companyId: company.id },
					}}
					asChild
				>
					<Pressable>
						<HStack space="md" className="items-center">
							<Avatar size="md" className="w-16 h-16 rounded-lg bg-primary">
								{company.company_type === "COLLECTOR" ? (
									<Sprout size={20} color={colors.white} />
								) : (
									<Text className="text-primary-foreground text-sm font-bold">
										{initials}
									</Text>
								)}
								{company.avatar && (
									<AvatarImage
										source={{
											uri: company.avatar,
											headers: getAuthenticatedImageHeaders(),
										}}
									/>
								)}
							</Avatar>

							<View className="flex-1 gap-1">
								<Text className="font-bold uppercase" numberOfLines={1}>
									{company.business_name}
								</Text>
								<Text className="text-xs text-muted-foreground">
									{company.identity_type === "CNPJ" && company.identity
										? maskCnpj(company.identity)
										: "Coletor independente"}
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
						</HStack>
					</Pressable>
				</Link>
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerClassName="gap-2"
					pointerEvents="auto"
				>
					<HStack space="sm">
						{(!appliedFilters.category ||
							appliedFilters.category === "waste") &&
							company.wastes.map(waste => (
								<Badge
									key={waste.id}
									variant="secondary"
									className="px-4 py-2 gap-2"
								>
									<BadgeIcon as={RecycleIcon} />
									<BadgeText>{waste.name}</BadgeText>
								</Badge>
							))}
						{(!appliedFilters.category ||
							appliedFilters.category === "services") &&
							company.services.map(service => (
								<Badge
									key={service.id}
									variant="secondary"
									className="px-4 py-2 gap-2"
								>
									<BadgeIcon as={HammerIcon} />
									<BadgeText>{service.name}</BadgeText>
								</Badge>
							))}
					</HStack>
				</ScrollView>
			</VStack>
		</Card>
	);
}

export default function MarketScreen() {
	useRouteInteractive();
	const insets = useSafeAreaInsets();
	const currentDate = useNow();
	const { permissionDenied } = useGeospatial();
	const {
		locationSource,
		isLocationReady,
		companies,
		isPending,
		isFetchingNextPage,
		hasNextPage,
		fetchNextPage,
		isError,
	} = useMarket();

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
			<View className="px-4" style={{ paddingTop: insets.top + 16 }}>
				<TestingWarningAlert />
			</View>
			<FlatList
				data={companies}
				keyExtractor={company => company.id}
				contentContainerStyle={{
					paddingTop: insets.top,
					paddingHorizontal: 16,
					paddingBottom: 32,
				}}
				ListHeaderComponent={MarketListHeader}
				ItemSeparatorComponent={() => <View className="h-3" />}
				renderItem={({ item: company }) => (
					<CompanyCardItem company={company} currentDate={currentDate} />
				)}
				ListFooterComponent={ListFooter}
				ListEmptyComponent={
					!isLocationReady && locationSource === "profile" ? (
						<View className="p-4 gap-1">
							<Text className="text-sm font-semibold text-foreground">
								Endereço não configurado
							</Text>
							<Text className="text-xs text-muted-foreground">
								Adicione um endereço no seu perfil para ver empresas próximas a
								você.
							</Text>
						</View>
					) : !isLocationReady &&
						locationSource === "current" &&
						permissionDenied ? (
						<View className="p-4">
							<LocationPermissionAlert message="Habilite a localização do dispositivo ou use o endereço do seu perfil para ver empresas próximas a você." />
						</View>
					) : isPending ? (
						<View className="gap-3">
							{[0, 1, 2, 3].map(i => (
								<CompanyCardSkeleton key={i} />
							))}
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
			<LocationSourceBottomSheet />
			<RadiusBottomSheet />
		</KeyboardAvoidingView>
	);
}
