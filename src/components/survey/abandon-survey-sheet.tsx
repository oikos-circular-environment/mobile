import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Input, InputField } from "@/components/ui/input";
import {
	Modal,
	ModalBackdrop,
	ModalContent,
	ModalHeader,
} from "@/components/ui/modal";
import { drainOutbox, enqueueAbandon } from "@/libs/survey/queue/outbox";
import { useSurveyDraftStore } from "@/stores/survey-draft-store";
import { useSurveyExecutionStore } from "@/stores/survey-execution-store";
import { useSurveyStore } from "@/stores/survey-store";

interface AbandonSurveySheetProps {
	isOpen: boolean;
	onClose: () => void;
}

export function AbandonSurveySheet({
	isOpen,
	onClose,
}: AbandonSurveySheetProps) {
	const router = useRouter();
	const sessionId = useSurveyStore(s => s.sessionId);
	const activeMs = useSurveyExecutionStore(s => s.suiteActiveMs);
	const suiteCode = useSurveyExecutionStore(s => s.suiteCode);
	const [reason, setReason] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleAbandon = async () => {
		if (!sessionId) return;
		setIsSubmitting(true);
		try {
			const now = new Date().toISOString();
			await enqueueAbandon(sessionId, {
				session_id: sessionId,
				active_ms: activeMs,
				wall_ms: activeMs,
				finished_at: now,
				reason: reason.trim() || undefined,
				current_suite_code: suiteCode ?? undefined,
			});
			await drainOutbox(sessionId);

			useSurveyStore.getState().setStatus("ABANDONED");
			useSurveyExecutionStore.getState().reset();
			useSurveyDraftStore.getState().reset();
			onClose();
			router.dismissTo("/(tabs)/(home)" as never);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose} useRNModal>
			<ModalBackdrop />
			<ModalContent className="gap-4">
				<ModalHeader className="flex-col items-start gap-1">
					<Heading size="lg">Abandonar a pesquisa?</Heading>
				</ModalHeader>

				<Input className="h-24 items-start px-3 py-2.5">
					<InputField
						placeholder="Opcional. O que impediu de continuar? Ajuda a melhorar a pesquisa."
						value={reason}
						onChangeText={setReason}
						multiline
						numberOfLines={4}
						textAlignVertical="top"
						maxLength={500}
					/>
				</Input>

				<View className="gap-2.5">
					<Button
						className="bg-red-600"
						disabled={isSubmitting}
						onPress={handleAbandon}
					>
						{isSubmitting ? <ButtonSpinner /> : null}
						<ButtonText>Sim, abandonar</ButtonText>
					</Button>
					<Button variant="outline" onPress={onClose} disabled={isSubmitting}>
						<ButtonText>Cancelar</ButtonText>
					</Button>
				</View>
			</ModalContent>
		</Modal>
	);
}
