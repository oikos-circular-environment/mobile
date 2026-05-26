import { router } from "expo-router";
import { Plus, ShieldIcon } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { ComplaintPainel } from "@/components/complaints/complaint-painel";
import { colors } from "@/components/style/colors";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import {
	Modal,
	ModalBackdrop,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
} from "@/components/ui/modal";
import { Text } from "@/components/ui/text";
import { useAuthContext } from "@/contexts/auth-context";

export function ComplaintListHeader() {
	const { isAuthenticated } = useAuthContext();
	const [showAuthModal, setShowAuthModal] = useState(false);

	const handleNewComplaint = () => {
		if (!isAuthenticated) {
			setShowAuthModal(true);
			return;
		}
		router.push("/(tabs)/complaints/(create)/camera");
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

				<Button size="lg" onPress={handleNewComplaint}>
					<ButtonText className="flex-1 text-center font-semibold text-white">
						Nova Denúncia
					</ButtonText>
					<ButtonIcon as={Plus} className="text-white" height={18} width={18} />
				</Button>

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

			<Modal
				isOpen={showAuthModal}
				onClose={() => setShowAuthModal(false)}
				useRNModal
			>
				<ModalBackdrop />
				<ModalContent>
					<ModalHeader className="flex-col items-start gap-1">
						<Heading size="md" className="text-base text-gray-950">
							Colabore com o ecossistema
						</Heading>
						<Text className="text-sm text-gray-500">
							Para registrar uma denúncia você precisa ter uma conta.
							Cadastre-se gratuitamente e ajude a proteger o meio ambiente.
						</Text>
					</ModalHeader>
					<ModalBody />
					<ModalFooter className="gap-2">
						<Button
							variant="outline"
							className="flex-1 rounded-md border-gray-200"
							onPress={() => setShowAuthModal(false)}
						>
							<ButtonText className="text-gray-700">Fechar</ButtonText>
						</Button>
						<Button
							className="flex-1 bg-lime-800 rounded-md"
							onPress={() => {
								setShowAuthModal(false);
								router.push("/(tabs)/(home)/sign-in");
							}}
						>
							<ButtonText>Login</ButtonText>
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</>
	);
}
