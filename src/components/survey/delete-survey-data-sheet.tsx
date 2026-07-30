import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import {
	Modal,
	ModalBackdrop,
	ModalContent,
	ModalHeader,
} from "@/components/ui/modal";
import { Text } from "@/components/ui/text";
import { deleteLocalSurveyData } from "@/libs/survey/delete-local-data";
import { useSurveyDraftStore } from "@/stores/survey-draft-store";
import { useSurveyExecutionStore } from "@/stores/survey-execution-store";
import { useSurveyStore } from "@/stores/survey-store";

interface DeleteSurveyDataSheetProps {
	isOpen: boolean;
	onClose: () => void;
	participantCode: string | null;
}

export function DeleteSurveyDataSheet({
	isOpen,
	onClose,
	participantCode,
}: DeleteSurveyDataSheetProps) {
	const router = useRouter();
	const sessionId = useSurveyStore(s => s.sessionId);
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDelete = async () => {
		if (!sessionId) return;
		setIsDeleting(true);
		try {
			await deleteLocalSurveyData(sessionId);
			useSurveyStore.getState().reset();
			useSurveyExecutionStore.getState().reset();
			useSurveyDraftStore.getState().reset();
			onClose();
			router.dismissTo("/(tabs)/(home)" as never);
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose} useRNModal>
			<ModalBackdrop />
			<ModalContent className="gap-4">
				<ModalHeader className="flex-col items-start gap-1">
					<Heading size="lg">Excluir meus dados da pesquisa?</Heading>
				</ModalHeader>

				<Text size="sm" className="leading-5">
					Todas as respostas e o progresso guardados neste aparelho para o
					código abaixo serão apagados agora. Para excluir também o que já foi
					enviado ao servidor, entre em contato com o pesquisador informando
					este código — é assim que o pedido de exclusão é processado.
				</Text>

				<View className="items-center rounded-lg bg-gray-50 p-4">
					<Text bold>{participantCode ?? "Sincronizando…"}</Text>
				</View>

				<Button
					className="bg-red-600"
					disabled={isDeleting}
					onPress={handleDelete}
				>
					{isDeleting ? <ButtonSpinner /> : null}
					<ButtonText>Excluir meus dados</ButtonText>
				</Button>
				<Button variant="outline" onPress={onClose} disabled={isDeleting}>
					<ButtonText>Cancelar</ButtonText>
				</Button>
			</ModalContent>
		</Modal>
	);
}
