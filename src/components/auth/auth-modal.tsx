import { router } from "expo-router";
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

type AuthModalProps = {
	isOpen: boolean;
	onClose: () => void;
	description?: string;
};

export function AuthModal({
	isOpen,
	onClose,
	description = "Para acessar esta funcionalidade você precisa ter uma conta. Cadastre-se gratuitamente e ajude a proteger o meio ambiente.",
}: AuthModalProps) {
	const handleLogin = () => {
		onClose();
		router.push("/(tabs)/(home)/sign-in");
	};

	const handleRegister = () => {
		onClose();
		router.push("/(tabs)/(home)/sign-up");
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose} useRNModal>
			<ModalBackdrop />
			<ModalContent className="gap-4">
				<ModalHeader className="flex-col items-start gap-1">
					<Heading size="xl">Colabore com o ecossistema</Heading>
					<Text>{description}</Text>
				</ModalHeader>
				<ModalFooter className="gap-2">
					<Button
						variant="outline"
						className="flex-1 border-gray-200"
						onPress={handleRegister}
					>
						<ButtonText className="text-gray-700">Registrar-se</ButtonText>
					</Button>
					<Button className="flex-1 bg-lime-800" onPress={handleLogin}>
						<ButtonText>Login</ButtonText>
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}
