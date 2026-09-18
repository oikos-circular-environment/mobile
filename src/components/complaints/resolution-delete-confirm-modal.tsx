import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
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

type ResolutionDeleteConfirmModalProps = {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	isDeleting: boolean;
};

export function ResolutionDeleteConfirmModal({
	isOpen,
	onClose,
	onConfirm,
	isDeleting,
}: ResolutionDeleteConfirmModalProps) {
	return (
		<Modal isOpen={isOpen} onClose={onClose} size="sm" useRNModal>
			<ModalBackdrop />
			<ModalContent>
				<ModalHeader>
					<Heading size="md">Excluir resolução</Heading>
				</ModalHeader>
				<ModalBody>
					<Text className="text-sm text-gray-600">
						Tem certeza que deseja excluir esta resolução? Esta ação não pode
						ser desfeita.
					</Text>
				</ModalBody>
				<ModalFooter className="gap-2">
					<Button
						variant="outline"
						className="flex-1"
						onPress={onClose}
						isDisabled={isDeleting}
					>
						<ButtonText>Cancelar</ButtonText>
					</Button>
					<Button
						className="flex-1 bg-red-600"
						onPress={onConfirm}
						isDisabled={isDeleting}
					>
						<ButtonText className="text-white">Excluir</ButtonText>
						{isDeleting && <ButtonSpinner />}
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}
