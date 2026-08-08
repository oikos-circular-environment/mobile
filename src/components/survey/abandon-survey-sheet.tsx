import BottomSheet, {
	BottomSheetBackdrop,
	type BottomSheetBackdropProps,
	BottomSheetTextInput,
	BottomSheetView,
} from "@gorhom/bottom-sheet";
import { eq } from "drizzle-orm";
import * as Crypto from "expo-crypto";
import { useRouter } from "expo-router";
import {
	forwardRef,
	useCallback,
	useImperativeHandle,
	useRef,
	useState,
} from "react";
import { View } from "react-native";
import { colors } from "@/components/style/colors";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { buildCheckpoint } from "@/libs/survey/build-checkpoint";
import { getSurveyDb } from "@/libs/survey/db/client";
import { surveySuiteRun } from "@/libs/survey/db/schema";
import {
	drainOutbox,
	enqueueAbandon,
	enqueueCheckpoint,
} from "@/libs/survey/queue/outbox";
import { sessionTotals } from "@/libs/survey/session-totals";
import { useSurveyDraftStore } from "@/stores/survey-draft-store";
import { useSurveyExecutionStore } from "@/stores/survey-execution-store";
import { useSurveyStore } from "@/stores/survey-store";

export interface AbandonSurveySheetHandle {
	open: () => void;
	close: () => void;
}

// O sheet só reposiciona sobre o teclado se o campo for o BottomSheetTextInput
// dele — um TextInput comum (o que o InputField do gluestack renderiza) não é
// rastreado e acaba coberto. Por isso o campo vai estilizado via style, já que
// o componente não passa pelo NativeWind.
const textInputStyle = {
	flex: 1,
	fontSize: 16,
	color: colors.gray[900],
	textAlignVertical: "top",
} as const;

export const AbandonSurveySheet = forwardRef<AbandonSurveySheetHandle>(
	(_props, ref) => {
		const router = useRouter();
		const sessionId = useSurveyStore(s => s.sessionId);
		const activeMs = useSurveyExecutionStore(s => s.suiteActiveMs);
		const suiteCode = useSurveyExecutionStore(s => s.suiteCode);
		const suiteQueue = useSurveyExecutionStore(s => s.suiteQueue);
		const suiteIndex = useSurveyExecutionStore(s => s.suiteIndex);
		const suiteRunId = useSurveyExecutionStore(s => s.suiteRunId);
		const tasks = useSurveyExecutionStore(s => s.tasks);
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
				const db = getSurveyDb();

				// Suíte em andamento (se houver): fórmula normal de contagem, tasks reais —
				// não é forçada a NO, o participante ainda pode ter concluído boa parte dela.
				if (suiteRunId && suiteCode) {
					const suiteRunRow = await db
						.select()
						.from(surveySuiteRun)
						.where(eq(surveySuiteRun.id, suiteRunId))
						.then(rows => rows[0]);
					const doneCount = tasks.filter(t => t.status === "done").length;
					const currentOutcome =
						doneCount === tasks.length
							? "YES"
							: doneCount === 0
								? "NO"
								: "PARTIAL";

					const suiteStartedAt = suiteRunRow?.startedAt ?? now;
					const suiteWallMs = Math.max(
						0,
						new Date(now).getTime() - new Date(suiteStartedAt).getTime(),
					);

					await db
						.update(surveySuiteRun)
						.set({
							finishedAt: now,
							activeMs,
							wallMs: suiteWallMs,
							outcome: currentOutcome,
							synced: false,
						})
						.where(eq(surveySuiteRun.id, suiteRunId));

					const checkpointPayload = await buildCheckpoint(
						sessionId,
						suiteRunId,
						true,
					);
					await enqueueCheckpoint(sessionId, suiteRunId, checkpointPayload);
				}

				// Suítes do roteiro ainda não iniciadas: outcome NO forçado, sem tarefas.
				const startFrom = suiteRunId ? suiteIndex + 1 : suiteIndex;
				for (let i = startFrom; i < suiteQueue.length; i += 1) {
					const forcedSuiteRunId = Crypto.randomUUID();
					await enqueueCheckpoint(sessionId, forcedSuiteRunId, {
						session_id: sessionId,
						suite: {
							code: suiteQueue[i],
							position: i,
							started_at: now,
							active_ms: 0,
							wall_ms: 0,
							finished_at: now,
							outcome: "NO",
						},
						tasks: [],
						answers: [],
					});
				}

				// E5 por último — a fila do outbox respeita ordem de criação.
				const totals = await sessionTotals(sessionId, now);

				await enqueueAbandon(sessionId, {
					session_id: sessionId,
					active_ms: totals.activeMs,
					wall_ms: totals.wallMs,
					finished_at: now,
					reason: reason.trim() || undefined,
					current_suite_code: suiteCode ?? undefined,
				});
				await drainOutbox(sessionId);

				useSurveyStore.getState().setStatus("ABANDONED");
				// Reset seletivo — preserva suiteQueue/suiteIndex/tasks pra a tela "Minha
				// pesquisa" continuar mostrando as etapas como estavam no abandono.
				useSurveyExecutionStore.getState().setPaused(true);
				useSurveyExecutionStore.getState().setExpanded(false);
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
				keyboardBehavior="interactive"
				android_keyboardInputMode="adjustResize"
				backdropComponent={backdropComponent}
			>
				<BottomSheetView>
					<View className="gap-4 p-4 pb-8">
						<Heading size="lg">Abandonar a pesquisa?</Heading>

						<Input className="h-24 items-start px-3 py-2.5">
							<BottomSheetTextInput
								placeholder="Opcional. O que impediu de continuar? Ajuda a melhorar a pesquisa."
								placeholderTextColor={colors.gray[500]}
								value={reason}
								onChangeText={setReason}
								multiline
								numberOfLines={4}
								maxLength={500}
								style={textInputStyle}
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
