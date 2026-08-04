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
import { Input, InputField } from "@/components/ui/input";
import { drainOutbox, enqueueAbandon } from "@/libs/survey/queue/outbox";
import { useSurveyDraftStore } from "@/stores/survey-draft-store";
import { useSurveyExecutionStore } from "@/stores/survey-execution-store";
import { useSurveyStore } from "@/stores/survey-store";

export interface AbandonSurveySheetHandle {
	open: () => void;
	close: () => void;
}

export const AbandonSurveySheet = forwardRef<AbandonSurveySheetHandle>(
	(_props, ref) => {
		const router = useRouter();
		const sessionId = useSurveyStore(s => s.sessionId);
		const activeMs = useSurveyExecutionStore(s => s.suiteActiveMs);
		const suiteCode = useSurveyExecutionStore(s => s.suiteCode);
		const [reason, setReason] = useState("");
		const [isSubmitting, setIsSubmitting] = useState(false);
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
				sheetRef.current?.close();
				router.dismissTo("/(tabs)/(home)" as never);
			} finally {
				setIsSubmitting(false);
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
						<Heading size="lg">Abandonar a pesquisa?</Heading>

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

						<Button
							className="bg-red-600"
							disabled={isSubmitting}
							onPress={handleAbandon}
						>
							{isSubmitting ? <ButtonSpinner /> : null}
							<ButtonText>Sim, abandonar</ButtonText>
						</Button>
						<Button
							variant="outline"
							onPress={() => sheetRef.current?.close()}
							disabled={isSubmitting}
						>
							<ButtonText>Cancelar</ButtonText>
						</Button>
					</View>
				</BottomSheetView>
			</BottomSheet>
		);
	},
);

AbandonSurveySheet.displayName = "AbandonSurveySheet";
