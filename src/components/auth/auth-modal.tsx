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
	onBeforeLogin?: () => void;
};

export function AuthModal({
	isOpen,
	onClose,
	description = "Para acessar esta funcionalidade você precisa ter uma conta. Cadastre-se gratuitamente e ajude a proteger o meio ambiente.",
	onBeforeLogin,
}: AuthModalProps) {
	const handleLogin = () => {
		onClose();
		onBeforeLogin?.();
		router.push("/(tabs)/(home)/sign-in");
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose} useRNModal>
			<ModalBackdrop />
			<ModalContent>
				<ModalHeader className="flex-col items-start gap-1">
					<Heading size="md" className="text-base text-gray-950">
						Colabore com o ecossistema
					</Heading>
					<Text className="text-sm text-gray-500">{description}</Text>
				</ModalHeader>
				<ModalFooter className="gap-2">
					<Button
						variant="outline"
						className="flex-1 rounded-md border-gray-200"
						onPress={onClose}
					>
						<ButtonText className="text-gray-700">Fechar</ButtonText>
					</Button>
					<Button className="flex-1 rounded-md bg-lime-800" onPress={handleLogin}>
						<ButtonText>Login</ButtonText>
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}
