import { AlertTriangleIcon } from "lucide-react-native";
import { ActivityIndicator, View } from "react-native";
import { colors } from "@/components/style/colors";
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
import { VStack } from "@/components/ui/vstack";

type DeleteAccountModalProps = {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	isLoading: boolean;
};

export function DeleteAccountModal({
	isOpen,
	onClose,
	onConfirm,
	isLoading,
}: DeleteAccountModalProps) {
	return (
		<Modal isOpen={isOpen} onClose={onClose} useRNModal>
			<ModalBackdrop />
			<ModalContent className="gap-4">
				<ModalHeader className="flex-col items-start gap-3">
					<View className="w-12 h-12 rounded-full bg-red-100 items-center justify-center">
						<AlertTriangleIcon size={24} color={colors.red[600]} />
					</View>
					<VStack space="xs">
						<Heading size="xl">Excluir conta</Heading>
						<Text className="text-gray-500">
							Ao confirmar, sua conta será agendada para exclusão.
						</Text>
					</VStack>
				</ModalHeader>
				<VStack space="sm" className="px-4">
					<Text className="text-sm text-gray-600">
						• Você terá 90 dias para cancelar a decisão
					</Text>
					<Text className="text-sm text-gray-600">
						• Durante esse período, sua conta continuará funcionando normalmente
					</Text>
					<Text className="text-sm text-gray-600">
						• Após o prazo, todos os seus dados serão permanentemente apagados
					</Text>
				</VStack>
				<ModalFooter className="gap-2">
					<Button
						variant="outline"
						className="flex-1 border-gray-200"
						onPress={onClose}
						disabled={isLoading}
					>
						<ButtonText className="text-gray-700">Voltar</ButtonText>
					</Button>
					<Button
						className="flex-1 bg-red-600"
						onPress={onConfirm}
						disabled={isLoading}
					>
						{isLoading ? (
							<ActivityIndicator size="small" color={colors.white} />
						) : (
							<ButtonText>Confirmar exclusão</ButtonText>
						)}
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}
