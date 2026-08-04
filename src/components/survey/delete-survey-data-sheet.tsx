import BottomSheet, {
	BottomSheetBackdrop,
	type BottomSheetBackdropProps,
	BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import {
	forwardRef,
	useCallback,
	useImperativeHandle,
	useRef,
	useState,
} from "react";
import { View } from "react-native";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { deleteLocalSurveyData } from "@/libs/survey/delete-local-data";
import { useSurveyDraftStore } from "@/stores/survey-draft-store";
import { useSurveyExecutionStore } from "@/stores/survey-execution-store";
import { useSurveyStore } from "@/stores/survey-store";

export interface DeleteSurveyDataSheetHandle {
	open: () => void;
	close: () => void;
}

interface DeleteSurveyDataSheetProps {
	participantCode: string | null;
}

export const DeleteSurveyDataSheet = forwardRef<
	DeleteSurveyDataSheetHandle,
	DeleteSurveyDataSheetProps
>(({ participantCode }, ref) => {
	const router = useRouter();
	const sessionId = useSurveyStore(s => s.sessionId);
	const [isDeleting, setIsDeleting] = useState(false);
	const sheetRef = useRef<BottomSheet>(null);

	useImperativeHandle(ref, () => ({
		open: () => sheetRef.current?.snapToIndex(0),
		close: () => sheetRef.current?.close(),
	}));

	const backdropComponent = useCallback(
		(props: BottomSheetBackdropProps) => (
			<BottomSheetBackdrop
				{...props}
				appearsOnIndex={0}
				disappearsOnIndex={-1}
			/>
		),
		[],
	);

	const handleDelete = async () => {
		if (!sessionId) return;
		setIsDeleting(true);
		try {
			await deleteLocalSurveyData(sessionId);
			useSurveyStore.getState().reset();
			useSurveyExecutionStore.getState().reset();
			useSurveyDraftStore.getState().reset();
			sheetRef.current?.close();
			router.dismissTo("/(tabs)/(home)" as never);
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<BottomSheet
			ref={sheetRef}
			index={-1}
			enableDynamicSizing
			enablePanDownToClose
			backdropComponent={backdropComponent}
		>
			<BottomSheetView>
				<View className="gap-4 p-4 pb-8">
					<Heading size="lg">Excluir meus dados da pesquisa?</Heading>

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
					<Button
						variant="outline"
						onPress={() => sheetRef.current?.close()}
						disabled={isDeleting}
					>
						<ButtonText>Cancelar</ButtonText>
					</Button>
				</View>
			</BottomSheetView>
		</BottomSheet>
	);
});

DeleteSurveyDataSheet.displayName = "DeleteSurveyDataSheet";
