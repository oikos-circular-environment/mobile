import type BottomSheetType from "@gorhom/bottom-sheet";
import type { Href } from "expo-router";
import { Link, useRouter } from "expo-router";
import { RecycleIcon, ShieldIcon } from "lucide-react-native";
import type { ComponentType } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, View } from "react-native";
import { ProfileCompletionModal } from "@/components/auth/profile-completion-modal";
import { HomeGuestCard } from "@/components/home/home-guest-card";
import { HomeHeaderSkeleton } from "@/components/home/home-header-skeleton";
import { HomeUserCard } from "@/components/home/home-user-card";
import { LocationPermissionAlert } from "@/components/location-permission-alert";
import { SettingsBottomSheet } from "@/components/settings/settings-bottom-sheet";
import { colors } from "@/components/style/colors";
import { useSurveyInviteBanner } from "@/components/survey/hooks/use-survey-invite-banner";
import { SurveyInviteCard } from "@/components/survey/survey-invite-card";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Grid, GridItem } from "@/components/ui/grid";
import { Heading } from "@/components/ui/heading";
import {
	Modal,
	ModalBackdrop,
	ModalContent,
	ModalFooter,
	ModalHeader,
} from "@/components/ui/modal";
import { Text } from "@/components/ui/text";
import { useAuthContext } from "@/contexts/auth-context";
import { useGeospatial } from "@/contexts/geospatial-context";
import { useRouteInteractive } from "@/libs/use-route-interactive";

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
	useRouteInteractive();
	const { isAuthenticated, needsProfileCompletion, isLoading, signOut } =
		useAuthContext();
	const { permissionDenied } = useGeospatial();
	const surveyBanner = useSurveyInviteBanner();
	const router = useRouter();
	const [showProfileModal, setShowProfileModal] = useState(false);
	const [showSignOutModal, setShowSignOutModal] = useState(false);
	const settingsSheetRef = useRef<BottomSheetType>(null);
	const contentOpacity = useRef(new Animated.Value(0)).current;

	const handleOpenSettings = useCallback(() => {
		settingsSheetRef.current?.snapToIndex(0);
	}, []);

	const handleOpenAccount = useCallback(() => {
		settingsSheetRef.current?.close();
		router.push("/(tabs)/(home)/account");
	}, [router]);

	const handleSignOut = useCallback(() => {
		settingsSheetRef.current?.close();
		setShowSignOutModal(true);
	}, []);

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
							{isAuthenticated ? (
								<HomeUserCard onOpenSettings={handleOpenSettings} />
							) : (
								<HomeGuestCard />
							)}
						</Animated.View>
					)}
				</View>

				{/* Aviso de localização indisponível */}
				{permissionDenied && (
					<LocationPermissionAlert message="Habilite a localização para ver conteúdo e recomendações mais próximos de você." />
				)}

				{/* Convite da pesquisa de usabilidade */}
				{surveyBanner ? (
					<SurveyInviteCard
						title={surveyBanner.title}
						description={surveyBanner.description}
						ctaLabel={surveyBanner.ctaLabel}
						onPressCta={surveyBanner.onPress}
						personaLabel={surveyBanner.personaLabel}
						participantCode={surveyBanner.participantCode}
						stages={surveyBanner.stages}
						onPressDetails={surveyBanner.onPressDetails}
					/>
				) : null}

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
			</ScrollView>
			<ProfileCompletionModal
				isOpen={showProfileModal}
				onClose={() => setShowProfileModal(false)}
				description="Para acessar o gerenciamento de empresas você precisa finalizar o seu cadastro."
			/>

			{isAuthenticated && (
				<>
					<SettingsBottomSheet
						ref={settingsSheetRef}
						onOpenAccount={handleOpenAccount}
						onSignOut={handleSignOut}
					/>

					<Modal
						isOpen={showSignOutModal}
						onClose={() => setShowSignOutModal(false)}
						useRNModal
					>
						<ModalBackdrop />
						<ModalContent className="gap-4">
							<ModalHeader className="flex-col items-start gap-1">
								<Heading size="xl">Sair da conta</Heading>
								<Text>
									Você está prestes a sair da sua conta. Deseja continuar?
								</Text>
							</ModalHeader>
							<ModalFooter className="gap-2">
								<Button
									variant="outline"
									className="flex-1 border-gray-200"
									onPress={() => setShowSignOutModal(false)}
								>
									<ButtonText className="text-gray-700">Cancelar</ButtonText>
								</Button>
								<Button
									className="flex-1 bg-red-600"
									onPress={() => {
										setShowSignOutModal(false);
										signOut();
									}}
								>
									<ButtonText>Sair</ButtonText>
								</Button>
							</ModalFooter>
						</ModalContent>
					</Modal>
				</>
			)}
		</>
	);
}
