import { and, eq, inArray } from "drizzle-orm";
import * as Crypto from "expo-crypto";
import { useRouter } from "expo-router";
import { CloudOffIcon, InfoIcon, PartyPopperIcon } from "lucide-react-native";
import { useMemo, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
	AppButton as Button,
	AppButtonSpinner as ButtonSpinner,
	AppButtonText as ButtonText,
} from "@/components/app-button";
import { colors } from "@/components/style/colors";
import { useSurveyProtocol } from "@/components/survey/hooks/use-survey-protocol";
import { InfoExpand } from "@/components/survey/info-expand";
import {
	OptionRowList,
	type OptionRowListItem,
} from "@/components/survey/option-row-list";
import { QHeader } from "@/components/survey/q-header";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { getSurveyDb } from "@/libs/survey/db/client";
import {
	surveyAnswer,
	surveyOutbox,
	surveySuiteRun,
	surveyTaskRun,
} from "@/libs/survey/db/schema";
import { stop as stopEventRecorder } from "@/libs/survey/event-recorder";
import { drainOutbox, enqueueCheckpoint } from "@/libs/survey/queue/outbox";
import { useSurveyExecutionStore } from "@/stores/survey-execution-store";
import { useSurveyStore } from "@/stores/survey-store";

type AnswerValue = { valueText?: string; valueNumber?: number };

export default function SurveyQuestionnaireScreen() {
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const { data: protocol } = useSurveyProtocol();
	const sessionId = useSurveyStore(s => s.sessionId);
	const setPendingSync = useSurveyStore(s => s.setPendingSync);
	const hasPendingSync = useSurveyStore(s => s.hasPendingSync);

	const suiteCode = useSurveyExecutionStore(s => s.suiteCode);
	const suiteIndex = useSurveyExecutionStore(s => s.suiteIndex);
	const suiteQueue = useSurveyExecutionStore(s => s.suiteQueue);
	const suiteRunId = useSurveyExecutionStore(s => s.suiteRunId);
	const suiteActiveMs = useSurveyExecutionStore(s => s.suiteActiveMs);
	const tasks = useSurveyExecutionStore(s => s.tasks);
	const suiteOutcomeOverride = useSurveyExecutionStore(
		s => s.suiteOutcomeOverride,
	);
	const finishSuite = useSurveyExecutionStore(s => s.finishSuite);

	const [stepIndex, setStepIndex] = useState(0);
	const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
	const [showConfirmation, setShowConfirmation] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [remainingSuites, setRemainingSuites] = useState(0);

	const perSuiteQuestions = useMemo(
		() =>
			(protocol?.questions ?? [])
				.filter(q => q.scope === "PER_SUITE")
				.sort((a, b) => a.position - b.position),
		[protocol],
	);

	const errorRecoveryQuestion = perSuiteQuestions.find(
		q => q.key === "error_recovery",
	);
	const steps = perSuiteQuestions.filter(q => q.key !== "error_recovery");
	const question = steps[stepIndex];

	const errorRevealed = answers.error_occurred?.valueText === "YES";
	const totalCount = steps.length + (errorRevealed ? 1 : 0);
	const errorStepPosition = steps.findIndex(q => q.key === "error_occurred");
	const displayIndex =
		stepIndex + 1 + (errorRevealed && stepIndex > errorStepPosition ? 1 : 0);

	if (!protocol || !question || !suiteCode) {
		return <View className="flex-1 bg-white" />;
	}

	const isErrorGate = question.key === "error_occurred";
	const canContinue = isErrorGate
		? Boolean(answers.error_occurred) &&
			(answers.error_occurred?.valueText === "NO" ||
				Boolean(answers.error_recovery))
		: Boolean(answers[question.key]);

	const setAnswer = (key: string, value: AnswerValue) =>
		setAnswers(current => ({ ...current, [key]: value }));

	const submitCheckpoint = async () => {
		if (!sessionId || !suiteRunId) return;

		setIsSubmitting(true);
		try {
			const doneCount = tasks.filter(t => t.status === "done").length;
			const outcome =
				suiteOutcomeOverride ??
				(doneCount === tasks.length
					? "YES"
					: doneCount === 0
						? "NO"
						: "PARTIAL");
			const now = new Date().toISOString();
			const db = getSurveyDb();

			const suiteRunRow = await db
				.select()
				.from(surveySuiteRun)
				.where(eq(surveySuiteRun.id, suiteRunId))
				.then(rows => rows[0]);
			const suiteStartedAt = suiteRunRow?.startedAt ?? now;
			const suiteWallMs = Math.max(
				0,
				new Date(now).getTime() - new Date(suiteStartedAt).getTime(),
			);

			await db
				.update(surveySuiteRun)
				.set({
					finishedAt: now,
					activeMs: suiteActiveMs,
					wallMs: suiteWallMs,
					outcome,
					synced: false,
				})
				.where(eq(surveySuiteRun.id, suiteRunId));

			await Promise.all(
				Object.entries(answers).map(([questionKey, value]) =>
					db.insert(surveyAnswer).values({
						id: Crypto.randomUUID(),
						sessionId,
						suiteRunId,
						questionKey,
						valueText: value.valueText,
						valueNumber: value.valueNumber,
					}),
				),
			);

			const taskRuns = await db
				.select()
				.from(surveyTaskRun)
				.where(eq(surveyTaskRun.suiteRunId, suiteRunId));

			await enqueueCheckpoint(sessionId, {
				session_id: sessionId,
				chunk: { index: 0, total: 1 },
				suite: {
					code: suiteCode,
					position: suiteIndex,
					started_at: suiteStartedAt,
					active_ms: suiteActiveMs,
					wall_ms: suiteWallMs,
					finished_at: now,
					outcome,
				},
				tasks: taskRuns.map(run => ({
					code: run.taskCode,
					position: run.position,
					started_at: run.startedAt,
					finished_at: run.finishedAt ?? undefined,
					active_ms: run.activeMs ?? 0,
					outcome:
						(run.outcome as "YES" | "NO" | "PARTIAL" | null) ?? undefined,
					auto_detected: run.autoDetected,
				})),
				answers: Object.entries(answers).map(([question_key, value]) => ({
					question_key,
					value_text: value.valueText,
					value_number: value.valueNumber,
				})),
			});

			await drainOutbox(sessionId);
			const pending = await db
				.select()
				.from(surveyOutbox)
				.where(
					and(
						eq(surveyOutbox.sessionId, sessionId),
						inArray(surveyOutbox.status, ["PENDING", "FAILED"]),
					),
				);
			setPendingSync(pending.length > 0);

			setRemainingSuites(suiteQueue.length - (suiteIndex + 1));
			stopEventRecorder();
			finishSuite();
			setShowConfirmation(true);
		} finally {
			setIsSubmitting(false);
		}
	};

	const listHeader = (
		<View className="gap-5">
			<View className="flex-row items-start gap-2">
				<Heading size="xl" className="flex-1">
					{question.label}
				</Heading>
				{question.info_text ? (
					<InfoIcon size={20} color={colors.gray[400]} />
				) : null}
			</View>

			{question.info_text ? (
				<InfoExpand label="O que isso quer dizer?">
					<Text size="sm" className="leading-5">
						{question.info_text}
					</Text>
				</InfoExpand>
			) : null}

			{isErrorGate ? (
				<View className="gap-2.5">
					<Button
						variant={
							answers.error_occurred?.valueText === "YES"
								? "default"
								: "outline"
						}
						onPress={() => setAnswer("error_occurred", { valueText: "YES" })}
					>
						<ButtonText>Sim</ButtonText>
					</Button>
					<Button
						variant={
							answers.error_occurred?.valueText === "NO" ? "default" : "outline"
						}
						onPress={() => {
							setAnswer("error_occurred", { valueText: "NO" });
							setAnswers(current => {
								const { error_recovery, ...rest } = current;
								return rest;
							});
						}}
					>
						<ButtonText>Não</ButtonText>
					</Button>

					{errorRevealed && errorRecoveryQuestion ? (
						<Heading size="md" className="pt-4">
							{errorRecoveryQuestion.label}
						</Heading>
					) : null}
				</View>
			) : null}
		</View>
	);

	const items: OptionRowListItem[] = isErrorGate
		? errorRevealed && errorRecoveryQuestion
			? (errorRecoveryQuestion.options ?? []).map(option => ({
					key: option.key,
					title: option.label,
					selected: answers.error_recovery?.valueNumber === option.value,
					onPress: () =>
						setAnswer("error_recovery", { valueNumber: option.value }),
				}))
			: []
		: (question.options ?? []).map(option => ({
				key: option.key,
				title: option.label,
				selected: answers[question.key]?.valueNumber === option.value,
				onPress: () => setAnswer(question.key, { valueNumber: option.value }),
			}));

	const goToNextStep = () => {
		if (stepIndex < steps.length - 1) {
			setStepIndex(current => current + 1);
			return;
		}
		submitCheckpoint();
	};

	const handleContinueNow = () => {
		if (remainingSuites > 0) {
			router.replace("/survey/suite-intro");
		} else {
			router.replace("/survey/closing-comment");
		}
	};

	const handleContinueLater = () => {
		router.dismissTo("/(tabs)/(home)" as never);
	};

	if (showConfirmation) {
		return (
			<View
				className="flex-1 bg-white px-6 pb-8 justify-between"
				style={{ paddingTop: insets.top + 16 }}
			>
				<View className="flex-1 items-center justify-center gap-4">
					<PartyPopperIcon size={44} color={colors.lime[700]} />
					<Heading size="2xl" className="text-center">
						Etapa concluída!
					</Heading>
					<Text className="text-center leading-6">
						{remainingSuites > 0
							? `Faltam ${remainingSuites} de ${suiteQueue.length} etapas. Você pode continuar agora ou voltar depois — seu progresso fica salvo.`
							: "Essa era a última etapa. Falta só o comentário final, se você quiser deixar um."}
					</Text>
					{hasPendingSync ? (
						<View className="flex-row items-center gap-1.5 rounded-full bg-yellow-100 px-2.5 py-1.5">
							<CloudOffIcon size={14} color={colors.yellow[800]} />
							<Text size="xs" className="text-yellow-800">
								Suas respostas serão enviadas quando houver conexão
							</Text>
						</View>
					) : null}
				</View>

				<View className="gap-2.5">
					<Button onPress={handleContinueNow}>
						<ButtonText>
							{remainingSuites > 0
								? "Continuar para a próxima etapa"
								: "Continuar"}
						</ButtonText>
					</Button>
					{remainingSuites > 0 ? (
						<Button variant="outline" onPress={handleContinueLater}>
							<ButtonText>Continuar depois</ButtonText>
						</Button>
					) : null}
				</View>
			</View>
		);
	}

	return (
		<View
			className="flex-1 bg-white px-6 pb-6 gap-5"
			style={{ paddingTop: insets.top + 16 }}
		>
			<QHeader
				categoryLabel={`Etapa ${suiteIndex + 1}`}
				currentIndex={displayIndex}
				totalCount={totalCount}
			/>

			<OptionRowList data={items} ListHeaderComponent={listHeader} />

			<Button disabled={!canContinue || isSubmitting} onPress={goToNextStep}>
				{isSubmitting ? <ButtonSpinner /> : null}
				<ButtonText>Próxima</ButtonText>
			</Button>
		</View>
	);
}
