import { LogOutIcon } from "lucide-react-native";
import { useState } from "react";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
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

export function ButtonSignOut() {
	const { signOut } = useAuthContext();
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<Button
				variant="secondary"
				size="icon"
				className="size-12"
				onPress={() => setIsOpen(true)}
			>
				<ButtonIcon as={LogOutIcon} />
			</Button>

			<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} useRNModal>
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
							onPress={() => setIsOpen(false)}
						>
							<ButtonText className="text-gray-700">Cancelar</ButtonText>
						</Button>
						<Button
							className="flex-1 bg-red-600"
							onPress={() => {
								setIsOpen(false);
								signOut();
							}}
						>
							<ButtonText>Sair</ButtonText>
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</>
	);
}
