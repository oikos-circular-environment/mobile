import { router } from "expo-router";
import { CameraIcon, ShieldIcon } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { AuthModal } from "@/components/auth/auth-modal";
import { ComplaintPainel } from "@/components/complaints/complaint-painel";
import { colors } from "@/components/style/colors";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { useAuthContext } from "@/contexts/auth-context";
import { HStack } from "../ui/hstack";

export function ComplaintListHeader() {
	const { isAuthenticated } = useAuthContext();
	const [showAuthModal, setShowAuthModal] = useState(false);

	const handleNewComplaint = () => {
		if (!isAuthenticated) {
			setShowAuthModal(true);
			return;
		}
		router.push("/(tabs)/complaints/(create)");
	};

	return (
		<>
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
							<ShieldIcon size={24} color={colors.white} strokeWidth={2.25} />
						</View>
					</View>
				</Card>

				<HStack className="gap-2">
					<Button size="lg" className="flex-1" onPress={handleNewComplaint}>
						<ButtonIcon as={CameraIcon} className="text-white" />
						<ButtonText className="text-center font-semibold text-white">
							Nova Denúncia{" "}
						</ButtonText>
					</Button>
				</HStack>

				<View className="justify-center">
					<Heading>Dashboard</Heading>
					<Text className="text-sm text-muted-foreground">
						Os campos abaixo servem como filtros, clique sobre eles para filtrar
						sua lista.
					</Text>
				</View>

				<ComplaintPainel />

				<View>
					<Heading>Denúncias</Heading>
				</View>
			</View>

			<AuthModal
				isOpen={showAuthModal}
				onClose={() => setShowAuthModal(false)}
				description="Para registrar uma denúncia você precisa ter uma conta. Cadastre-se gratuitamente e ajude a proteger o meio ambiente."
			/>
		</>
	);
}
