import { useQuery } from "@tanstack/react-query";
import type { Href } from "expo-router";
import { Link } from "expo-router";
import {
	ArrowRight,
	RecycleIcon,
	ShieldIcon,
	Sprout,
} from "lucide-react-native";
import type { ComponentType } from "react";
import { useEffect, useRef, useState } from "react";
import {
	ActivityIndicator,
	Animated,
	Pressable,
	ScrollView,
	View,
} from "react-native";
import { ProfileCompletionModal } from "@/components/auth/profile-completion-modal";
import { HomeGuestCard } from "@/components/home/home-guest-card";
import { HomeHeaderSkeleton } from "@/components/home/home-header-skeleton";
import { HomeUserCard } from "@/components/home/home-user-card";
import { colors } from "@/components/style/colors";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Grid, GridItem } from "@/components/ui/grid";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { useAuthContext } from "@/contexts/auth-context";
import { useGeospatial } from "@/contexts/geospatial-context";
import { isCompanyOpenNow } from "@/libs/market/is-company-open";
import { getV1Market } from "@/libs/oikos-sdk";

const formatDistance = (meters: number) => {
	if (meters >= 1000)
		return `${(meters / 1000).toFixed(1).replace(".", ",")} km`;
	return `${Math.round(meters)} m`;
};

function ServiceCard({
	label,
	description,
	href,
	Icon,
	dark,
	onPress,
}: {
	label: string;
	description: string;
	href: Href;
	Icon: ComponentType<{ size: number; color: string }>;
	dark?: boolean;
	onPress?: () => void;
}) {
	const iconBg = dark ? "bg-gray-900" : "bg-lime-800";
	const content = (
		<Card className="shadow-none bg-gray-50 gap-3">
			<View
				className={`w-10 h-10 rounded-lg items-center justify-center ${iconBg}`}
			>
				<Icon size={18} color={colors.white} />
			</View>
			<View className="gap-0.5">
				<Text className="font-semibold text-gray-900">{label}</Text>
				<Text className="text-xs text-gray-500">{description}</Text>
			</View>
		</Card>
	);

	if (onPress) {
		return <Pressable onPress={onPress}>{content}</Pressable>;
	}

	return (
		<Link href={href} asChild>
			<Pressable>{content}</Pressable>
		</Link>
	);
}

export default function HomeScreen() {
	const { isAuthenticated, needsProfileCompletion, isLoading } =
		useAuthContext();
	const [showProfileModal, setShowProfileModal] = useState(false);
	const { location, currentDate, isResolving, permissionDenied } =
		useGeospatial();
	const contentOpacity = useRef(new Animated.Value(0)).current;

	const lat = location?.coords.latitude;
	const lon = location?.coords.longitude;
	const isLocationReady = lat != null && lon != null;

	const { data: nearbyData, isPending: isNearbyPending } = useQuery({
		queryKey: ["home-nearby", lat, lon],
		queryFn: () => {
			if (lat == null || lon == null) throw new Error("unreachable");
			return getV1Market({
				query: { lat, lon, radius: 2000, limit: 5 },
			}).then(r => r.data);
		},
		enabled: isLocationReady,
	});

	const nearbyCompanies = nearbyData?.companies ?? [];

	useEffect(() => {
		if (!isLoading) {
			Animated.timing(contentOpacity, {
				toValue: 1,
				duration: 400,
				useNativeDriver: true,
			}).start();
		} else {
			contentOpacity.setValue(0);
		}
	}, [isLoading, contentOpacity]);

	return (
		<>
			<ScrollView
				className="flex-1 bg-white"
				contentContainerClassName="p-4 pb-8 gap-6"
			>
				{/* Header — perfil ou CTA de login */}
				<View>
					{isLoading ? (
						<HomeHeaderSkeleton />
					) : (
						<Animated.View style={{ opacity: contentOpacity }}>
							{isAuthenticated ? <HomeUserCard /> : <HomeGuestCard />}
						</Animated.View>
					)}
				</View>

				{/* Serviços */}
				<View className="gap-3">
					<Heading>Serviços</Heading>
					<Grid className="gap-3" _extra={{ className: "grid-cols-2" }}>
						<GridItem _extra={{ className: "col-span-1" }}>
							<ServiceCard
								label="Pontos de Coleta"
								description="Descarte seus resíduos"
								href="/(tabs)/market"
								Icon={RecycleIcon}
							/>
						</GridItem>
						<GridItem _extra={{ className: "col-span-1" }}>
							<ServiceCard
								label="Denúncias"
								description="Reporte irregularidades"
								href="/(tabs)/complaints"
								Icon={ShieldIcon}
							/>
						</GridItem>
						{isAuthenticated && (
							<GridItem _extra={{ className: "col-span-1" }}>
								<ServiceCard
									label="Empresas"
									description="Cadastre suas empresas"
									href="/(tabs)/(home)/companies"
									Icon={ShieldIcon}
									onPress={
										needsProfileCompletion
											? () => setShowProfileModal(true)
											: undefined
									}
								/>
							</GridItem>
						)}
					</Grid>
				</View>

				{/* Empresas próximas */}
				<View className="gap-3">
					<View className="flex-row items-center justify-between">
						<View className="gap-0.5">
							<Heading>Próximas de você</Heading>
							<Text size="sm" className="text-gray-500">
								Empresas em até 2 km
							</Text>
						</View>
						<Link href="/(tabs)/market" asChild>
							<Pressable className="flex-row items-center gap-1">
								<Text className="font-semibold text-lime-800 text-sm">
									Ver todas
								</Text>
								<ArrowRight size={14} color={colors.lime[800]} />
							</Pressable>
						</Link>
					</View>

					{permissionDenied ? (
						<Card className="shadow-none bg-gray-50 p-4 gap-1">
							<Text className="font-semibold text-gray-900">
								Localização indisponível
							</Text>
							<Text className="text-xs text-gray-500">
								Permita o acesso à localização nas configurações do dispositivo.
							</Text>
						</Card>
					) : isResolving || !isLocationReady ? (
						<Card className="items-center p-6 shadow-none bg-gray-50">
							<ActivityIndicator size="small" color={colors.lime[800]} />
							<Text className="mt-2 text-gray-500">Obtendo localização…</Text>
						</Card>
					) : isNearbyPending ? (
						<Card className="items-center p-6 shadow-none bg-gray-50">
							<ActivityIndicator size="small" color={colors.lime[800]} />
							<Text className="mt-2 text-gray-500">Buscando empresas…</Text>
						</Card>
					) : nearbyCompanies.length === 0 ? (
						<Card className="shadow-none bg-gray-50 p-4">
							<Text className="text-gray-500">
								Nenhuma empresa encontrada em até 2 km.
							</Text>
						</Card>
					) : (
						<View className="gap-3">
							{nearbyCompanies.map(item => {
								const isOpen = isCompanyOpenNow(
									item.business_hours,
									currentDate,
								);
								return (
									<Link
										key={item.id}
										href={{
											pathname: "/market/[companyId]",
											params: { companyId: item.id },
										}}
										asChild
									>
										<Pressable>
											<Card
												size="sm"
												className="border-0 bg-gray-100 shadow-none"
											>
												<View className="flex-row items-center gap-3">
													<View className="h-12 w-12 items-center justify-center overflow-hidden rounded-[5px] bg-lime-800">
														{item.company_type === "COLLECTOR" ? (
															<Sprout size={16} color={colors.white} />
														) : (
															<Text className="text-[10px] font-semibold text-white">
																{item.corporate_name
																	.split(" ")
																	.slice(0, 2)
																	.map(word => word[0]?.toUpperCase() ?? "")
																	.join("")}
															</Text>
														)}
													</View>

													<View className="min-w-0 flex-1 gap-1">
														<View className="flex-row items-center gap-2">
															<Text
																className="font-semibold text-gray-950 flex-1"
																numberOfLines={1}
															>
																{item.corporate_name}
															</Text>
															<Badge
																variant={isOpen ? "default" : "destructive"}
															>
																<BadgeText>
																	{isOpen ? "Aberto" : "Fechado"}
																</BadgeText>
															</Badge>
														</View>
														<Text
															className="text-xs leading-4 text-gray-500"
															numberOfLines={1}
														>
															{item.wastes
																.map(w => w.name)
																.slice(0, 3)
																.join(", ")}
														</Text>
														<Text className="text-xs text-gray-400">
															{formatDistance(item.distance_in_meters)}
														</Text>
													</View>

													<ArrowRight size={16} color={colors.gray[400]} />
												</View>
											</Card>
										</Pressable>
									</Link>
								);
							})}
						</View>
					)}
				</View>
			</ScrollView>
			<ProfileCompletionModal
				isOpen={showProfileModal}
				onClose={() => setShowProfileModal(false)}
				description="Para acessar o gerenciamento de empresas você precisa finalizar o seu cadastro."
			/>
		</>
	);
}
