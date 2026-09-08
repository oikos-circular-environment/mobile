import { format, formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { AttachmentPreviewList } from "@/components/denunciation/attachment-row";
import { useCancelDenunciation } from "@/components/denunciation/hooks/use-cancel-denunciation";
import { DenunciationSeverityBadge } from "@/components/denunciation/severity-badge";
import { DenunciationStatusBadge } from "@/components/denunciation/status-badge";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import {
	Modal,
	ModalBackdrop,
	ModalContent,
	ModalFooter,
	ModalHeader,
} from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { useRouteInteractive } from "@/libs/use-route-interactive";
import { useDenunciationStore } from "@/stores/denunciation-store";

export default function DenunciationDetailScreen() {
	useRouteInteractive();
	const { id } = useLocalSearchParams<{ id: string }>();
	const [showCancelModal, setShowCancelModal] = useState(false);

	const data = useDenunciationStore(s =>
		s.denunciations.find(denunciation => denunciation.id === id),
	);

	const cancelMutation = useCancelDenunciation(id);

	return (
		<View className="flex-1 bg-white">
			<Stack.Screen options={{ title: data?.title ?? "Denúncia" }} />
			{!data ? (
				<View className="flex-1 items-center justify-center px-4">
					<Text className="text-center text-gray-500">
						Denúncia não encontrada.
					</Text>
				</View>
			) : (
				<ScrollView showsVerticalScrollIndicator={false}>
					<View className="gap-3 p-4">
						<View className="flex-row items-center gap-2">
							<DenunciationSeverityBadge severity={data.severity} />
							<DenunciationStatusBadge status={data.status} />
						</View>
						{data.reporter_email ? (
							<Text className="text-sm text-gray-500">
								E-mail: {data.reporter_email}
							</Text>
						) : null}
						<Text className="text-xs text-gray-400">
							{`${format(data.created_at, "d 'de' MMMM 'de' yyyy", { locale: ptBR })} · Aberto ${formatDistanceToNowStrict(data.created_at, { locale: ptBR, addSuffix: true })}`}
						</Text>
						<Text className="text-gray-700">{data.description}</Text>
						<AttachmentPreviewList attachments={data.attachments} />
					</View>

					{data.status === "OPEN" && (
						<View className="px-4">
							<Button
								variant="outline"
								className="border-red-300"
								onPress={() => setShowCancelModal(true)}
							>
								<ButtonText className="text-red-600">
									Cancelar Denúncia
								</ButtonText>
							</Button>
						</View>
					)}

					{data.moderated_at != null &&
					data.reason != null &&
					data.reason.length > 0 ? (
						<View className="mx-4 mt-3 gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3">
							<Text className="text-xs font-bold uppercase text-gray-500">
								Resposta da moderação
							</Text>
							<Text className="text-xs text-gray-400">
								{`Equipe Oikos · ${format(data.moderated_at, "d 'de' MMMM 'de' yyyy", { locale: ptBR })} · ${formatDistanceToNowStrict(data.moderated_at, { locale: ptBR, addSuffix: true })}`}
							</Text>
							<Text className="text-gray-700">{data.reason}</Text>
						</View>
					) : null}
				</ScrollView>
			)}

			{data?.status === "OPEN" && (
				<Modal
					isOpen={showCancelModal}
					onClose={() => setShowCancelModal(false)}
					useRNModal
				>
					<ModalBackdrop />
					<ModalContent className="gap-4">
						<ModalHeader className="flex-col items-start gap-1">
							<Heading size="xl">Cancelar Denúncia</Heading>
							<Text>
								Você está prestes a cancelar esta denúncia. Deseja continuar?
							</Text>
						</ModalHeader>
						<ModalFooter className="gap-2">
							<Button
								variant="outline"
								className="flex-1 border-gray-200"
								onPress={() => setShowCancelModal(false)}
							>
								<ButtonText className="text-gray-700">Cancelar</ButtonText>
							</Button>
							<Button
								className="flex-1 bg-red-600"
								disabled={cancelMutation.isPending}
								onPress={() =>
									cancelMutation.mutate(undefined, {
										onSuccess: () => setShowCancelModal(false),
									})
								}
							>
								{cancelMutation.isPending ? (
									<Spinner size="small" />
								) : (
									<ButtonText>Cancelar Denúncia</ButtonText>
								)}
							</Button>
						</ModalFooter>
					</ModalContent>
				</Modal>
			)}
		</View>
	);
}
