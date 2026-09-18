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
import type { DraftAttachment } from "@/libs/types/complaint";

type AttachmentDeleteConfirmModalProps = {
	pendingDelete: DraftAttachment | null;
	cancelDelete: () => void;
	confirmDelete: () => void;
	isDeleting: boolean;
};

export function AttachmentDeleteConfirmModal({
	pendingDelete,
	cancelDelete,
	confirmDelete,
	isDeleting,
}: AttachmentDeleteConfirmModalProps) {
	return (
		<Modal isOpen={!!pendingDelete} onClose={cancelDelete} size="sm">
			<ModalBackdrop />
			<ModalContent>
				<ModalHeader>
					<Heading size="md">Remover anexo</Heading>
				</ModalHeader>
				<ModalBody>
					<Text className="text-sm text-gray-600">
						Tem certeza que deseja remover este anexo? Esta ação não pode ser
						desfeita.
					</Text>
				</ModalBody>
				<ModalFooter className="gap-2">
					<Button
						variant="outline"
						className="flex-1"
						onPress={cancelDelete}
						isDisabled={isDeleting}
					>
						<ButtonText>Cancelar</ButtonText>
					</Button>
					<Button
						className="flex-1 bg-red-600"
						onPress={confirmDelete}
						isDisabled={isDeleting}
					>
						<ButtonText className="text-white">Remover</ButtonText>
						{isDeleting && <ButtonSpinner />}
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}
