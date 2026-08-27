import type BottomSheetType from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { BuildingIcon, RecycleIcon, ShieldIcon } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, useWindowDimensions, View } from "react-native";
import { AuthModal } from "@/components/auth/auth-modal";
import { ProfileCompletionModal } from "@/components/auth/profile-completion-modal";
import { HomeHero } from "@/components/home/home-hero";
import {
	type ServiceCarouselItem,
	ServicesCarousel,
	ServicesCarouselSteps,
	ServicesCarouselTrack,
	ServicesRow,
} from "@/components/home/services-carousel";
import { LocationPermissionAlert } from "@/components/location-permission-alert";
import { SettingsBottomSheet } from "@/components/settings/settings-bottom-sheet";
import { SurveyInviteBanner } from "@/components/survey/survey-invite-banner";
import { Button, ButtonText } from "@/components/ui/button";
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

export default function HomeScreen() {
	useRouteInteractive();
	const { isAuthenticated, needsProfileCompletion, isLoading, signOut } =
		useAuthContext();
	const { permissionDenied } = useGeospatial();
	const router = useRouter();
	const { width, height } = useWindowDimensions();
	const isLandscape = width > height;
	const [showProfileModal, setShowProfileModal] = useState(false);
	const [showAuthModal, setShowAuthModal] = useState(false);
	const [showSignOutModal, setShowSignOutModal] = useState(false);
	const settingsSheetRef = useRef<BottomSheetType>(null);
	const isFirstDimensionChange = useRef(true);
	const hasAppliedMitigation = useRef(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: width só dispara o efeito na mudança de largura, não é lido no corpo
	useEffect(() => {
		if (isFirstDimensionChange.current) {
			isFirstDimensionChange.current = false;
			return;
		}
		if (hasAppliedMitigation.current) {
			return;
		}
		hasAppliedMitigation.current = true;
		settingsSheetRef.current?.close();
	}, [width]);

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

	const handlePressLogin = useCallback(() => {
		router.push("/sign-in");
	}, [router]);

	const services = useMemo<ServiceCarouselItem[]>(() => {
		const empresasOnPress = !isAuthenticated
			? () => setShowAuthModal(true)
			: needsProfileCompletion
				? () => setShowProfileModal(true)
				: undefined;

		return [
			{
				id: "pontos-de-coleta",
				image: require("@/assets/images/services/pontos-de-coleta.jpg"),
				gradientColors: ["#3e6111", "#d9d97d"],
				title: "RECICLAGEM",
				ctaLabel: "Reciclar agora",
				description:
					"Encontre pontos de coleta, coletores e empresas perto de você e dê o destino certo aos seus resíduos!",
				stepIcon: RecycleIcon,
				stepLabel: "Reciclar",
				href: "/(tabs)/market",
			},
			{
				id: "denuncias",
				image: require("@/assets/images/services/denuncias.jpg"),
				gradientColors: ["#0d1f33", "#5b7fae"],
				title: "DENÚNCIAS",
				ctaLabel: "Denunciar agora",
				description:
					"Fotografe e localize descarte irregular, acompanhe com a comunidade e ajude a manter o ambiente mais limpo e seguro!",
				stepIcon: ShieldIcon,
				stepLabel: "Denunciar",
				href: "/(tabs)/complaints",
			},
			{
				id: "empresas",
				image: require("@/assets/images/services/empresas.jpg"),
				gradientColors: ["#26241f", "#c9c4b8"],
				title: "EMPRESAS",
				ctaLabel: "Cadastrar agora",
				description:
					"Cadastre sua empresa ou ponto de coleta e ganhe visibilidade no Mercado para quem procura destinar resíduos!",
				stepIcon: BuildingIcon,
				stepLabel: "Empresa",
				href: "/(tabs)/(home)/companies",
				onPress: empresasOnPress,
			},
		];
	}, [isAuthenticated, needsProfileCompletion]);

	return (
		<>
			<ScrollView className="flex-1 bg-white" contentContainerClassName="pb-8">
				<HomeHero
					isAuthenticated={isAuthenticated}
					isLoading={isLoading}
					onOpenSettings={handleOpenSettings}
					onPressLogin={handlePressLogin}
				/>

				<View className="gap-6 px-4 pt-6">
					{/* Aviso de localização indisponível */}
					{permissionDenied && (
						<LocationPermissionAlert message="Habilite a localização para ver conteúdo e recomendações mais próximos de você." />
					)}

					{/* Convite da pesquisa de usabilidade */}
					<SurveyInviteBanner />

					{/* Serviços */}
					<View className="gap-3">
						<Heading>Serviços</Heading>
						{isLandscape ? (
							<View style={{ height: 340 }}>
								<ServicesRow items={services} />
							</View>
						) : (
							<ServicesCarousel items={services} autoPlayIntervalMs={5000}>
								<ServicesCarouselSteps />
								<ServicesCarouselTrack />
							</ServicesCarousel>
						)}
					</View>
				</View>
			</ScrollView>
			<ProfileCompletionModal
				isOpen={showProfileModal}
				onClose={() => setShowProfileModal(false)}
				description="Para acessar o gerenciamento de empresas você precisa finalizar o seu cadastro."
			/>
			<AuthModal
				isOpen={showAuthModal}
				onClose={() => setShowAuthModal(false)}
				description="Para cadastrar sua empresa você precisa ter uma conta. Cadastre-se gratuitamente e ajude a proteger o meio ambiente."
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
