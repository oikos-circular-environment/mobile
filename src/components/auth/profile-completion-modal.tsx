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

type ProfileCompletionModalProps = {
	isOpen: boolean;
	onClose: () => void;
	description?: string;
};

export function ProfileCompletionModal({
	isOpen,
	onClose,
	description = "Para acessar esta funcionalidade você precisa finalizar o seu cadastro.",
}: ProfileCompletionModalProps) {
	const handleComplete = () => {
		onClose();
		router.push("/(tabs)/(home)/profile");
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose} useRNModal>
			<ModalBackdrop />
			<ModalContent className="gap-4">
				<ModalHeader className="flex-col items-start gap-1">
					<Heading size="xl">Finalize seu cadastro</Heading>
					<Text>{description}</Text>
				</ModalHeader>
				<ModalFooter>
					<Button className="flex-1 bg-lime-800" onPress={handleComplete}>
						<ButtonText>Completar cadastro</ButtonText>
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}
