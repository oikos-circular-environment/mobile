import { format, formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Stack, useLocalSearchParams } from "expo-router";
import { Calendar, Clock, User } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { AttachmentPreviewList } from "@/components/denunciation/attachment-row";
import { DenunciationContextBadge } from "@/components/denunciation/context-badge";
import { useCancelDenunciation } from "@/components/denunciation/hooks/use-cancel-denunciation";
import { DenunciationSeverityBadge } from "@/components/denunciation/severity-badge";
import { DenunciationStatusBadge } from "@/components/denunciation/status-badge";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import {
	Modal,
	ModalBackdrop,
	ModalContent,
	ModalFooter,
	ModalHeader,
} from "@/components/ui/modal";
import { Text } from "@/components/ui/text";
import { useRouteInteractive } from "@/hooks/use-route-interactive";
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
			<Stack.Screen options={{ title: "Denúncia" }} />
			{!data ? (
				<View className="flex-1 items-center justify-center px-4">
					<Text className="text-center text-gray-500">
						Denúncia não encontrada.
					</Text>
				</View>
			) : (
				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerClassName="gap-4 p-4 pb-8"
				>
					<View className="gap-3">
						<Heading size="lg" style={{ fontFamily: "Oswald_700Bold" }}>
							{data.title.toUpperCase()}
						</Heading>
						<View className="flex-row items-center gap-2">
							<DenunciationContextBadge />
							<DenunciationSeverityBadge severity={data.severity} />
							<DenunciationStatusBadge status={data.status} />
						</View>
						{data.reporter_email ? (
							<View className="flex-row items-center gap-2">
								<User size={14} color="#9ca3af" />
								<Text className="text-sm text-gray-500">
									{data.reporter_email}
								</Text>
							</View>
						) : null}
						<View className="flex-row items-center gap-2">
							<Calendar size={14} color="#9ca3af" />
							<Text className="text-xs text-gray-400">
								{format(data.created_at, "d 'de' MMMM 'de' yyyy", {
									locale: ptBR,
								})}
							</Text>
						</View>
						<View className="flex-row items-center gap-2">
							<Clock size={14} color="#9ca3af" />
							<Text className="text-xs text-gray-400">
								{`Aberto ${formatDistanceToNowStrict(data.created_at, { locale: ptBR, addSuffix: true })}`}
							</Text>
						</View>
						<View className="gap-1">
							<Text className="text-xs font-bold uppercase text-gray-500">
								Descrição
							</Text>
							<Text className="text-gray-700">{data.description}</Text>
						</View>
						{data.attachments.length > 0 ? (
							<View className="gap-1">
								<Text className="text-xs font-bold uppercase text-gray-500">
									Anexos
								</Text>
								<AttachmentPreviewList attachments={data.attachments} />
							</View>
						) : null}
					</View>

					{data.status === "OPEN" && (
						<View>
							<Button
								variant="destructive"
								onPress={() => setShowCancelModal(true)}
							>
								<ButtonText>Cancelar Denúncia</ButtonText>
							</Button>
						</View>
					)}

					{data.moderated_at != null &&
					data.reason != null &&
					data.reason.length > 0 ? (
						<View className="gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3">
							<Text className="text-xs font-bold uppercase text-gray-500">
								Resposta da moderação
							</Text>
							<View className="flex-row items-center gap-2">
								<User size={14} color="#9ca3af" />
								<Text className="text-xs text-gray-400">Equipe Oikos</Text>
							</View>
							<View className="flex-row items-center gap-2">
								<Calendar size={14} color="#9ca3af" />
								<Text className="text-xs text-gray-400">
									{format(data.moderated_at, "d 'de' MMMM 'de' yyyy", {
										locale: ptBR,
									})}
								</Text>
							</View>
							<View className="flex-row items-center gap-2">
								<Clock size={14} color="#9ca3af" />
								<Text className="text-xs text-gray-400">
									{`Respondido ${formatDistanceToNowStrict(data.moderated_at, { locale: ptBR, addSuffix: true })}`}
								</Text>
							</View>
							<View className="gap-1">
								<Text className="text-xs font-bold uppercase text-gray-500">
									Descrição
								</Text>
								<Text className="text-gray-700">{data.reason}</Text>
							</View>
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
								className="flex-1"
								onPress={() => setShowCancelModal(false)}
							>
								<ButtonText>Cancelar</ButtonText>
							</Button>
							<Button
								variant="destructive"
								className="flex-1"
								disabled={cancelMutation.isPending}
								onPress={() =>
									cancelMutation.mutate(undefined, {
										onSuccess: () => setShowCancelModal(false),
									})
								}
							>
								{cancelMutation.isPending ? (
									<ButtonSpinner />
								) : (
									<ButtonText>Cancelar</ButtonText>
								)}
							</Button>
						</ModalFooter>
					</ModalContent>
				</Modal>
			)}
		</View>
	);
}
