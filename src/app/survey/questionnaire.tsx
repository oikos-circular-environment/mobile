import { and, eq, inArray } from "drizzle-orm";
import * as Crypto from "expo-crypto";
import { useRouter } from "expo-router";
import { CloudOffIcon, InfoIcon, PartyPopperIcon } from "lucide-react-native";
import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { colors } from "@/components/style/colors";
import { useSurveyProtocol } from "@/components/survey/hooks/use-survey-protocol";
import { InfoExpand } from "@/components/survey/info-expand";
import { OptionRow } from "@/components/survey/option-row";
import { QHeader } from "@/components/survey/q-header";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { getSurveyDb } from "@/libs/survey/db/client";
import {
	surveyAnswer,
	surveyOutbox,
	surveySuiteRun,
} from "@/libs/survey/db/schema";
import { drainOutbox, enqueueCheckpoint } from "@/libs/survey/queue/outbox";
import { useSurveyExecutionStore } from "@/stores/survey-execution-store";
import { useSurveyStore } from "@/stores/survey-store";

type AnswerValue = { valueText?: string; valueNumber?: number };

export default function SurveyQuestionnaireScreen() {
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
				doneCount === tasks.length ? "YES" : doneCount === 0 ? "NO" : "PARTIAL";
			const now = new Date().toISOString();
			const db = getSurveyDb();

			await db
				.update(surveySuiteRun)
				.set({
					finishedAt: now,
					activeMs: suiteActiveMs,
					wallMs: suiteActiveMs,
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

			await enqueueCheckpoint(sessionId, {
				session_id: sessionId,
				chunk: { index: 0, total: 1 },
				suite: {
					code: suiteCode,
					position: suiteIndex,
					started_at: now,
					active_ms: suiteActiveMs,
					wall_ms: suiteActiveMs,
					finished_at: now,
					outcome,
				},
				answers: Object.entries(answers).map(([question_key, value]) => ({
					question_key,
					...value,
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
			finishSuite();
			setShowConfirmation(true);
		} finally {
			setIsSubmitting(false);
		}
	};

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
			<View className="flex-1 bg-white px-6 pb-8 pt-16 justify-between">
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
		<View className="flex-1 bg-white px-6 pb-6 pt-14 gap-5">
			<QHeader
				categoryLabel={`Etapa ${suiteIndex + 1}`}
				currentIndex={displayIndex}
				totalCount={totalCount}
			/>

			<ScrollView contentContainerClassName="gap-5" className="flex-1">
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
								answers.error_occurred?.valueText === "NO"
									? "default"
									: "outline"
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
							<View className="gap-2.5 pt-4">
								<Heading size="md">{errorRecoveryQuestion.label}</Heading>
								{errorRecoveryQuestion.options?.map(option => (
									<OptionRow
										key={option.key}
										title={option.label}
										selected={
											answers.error_recovery?.valueNumber === option.value
										}
										onPress={() =>
											setAnswer("error_recovery", {
												valueNumber: option.value,
											})
										}
									/>
								))}
							</View>
						) : null}
					</View>
				) : (
					<View className="gap-2.5">
						{question.options?.map(option => (
							<OptionRow
								key={option.key}
								title={option.label}
								selected={answers[question.key]?.valueNumber === option.value}
								onPress={() =>
									setAnswer(question.key, { valueNumber: option.value })
								}
							/>
						))}
					</View>
				)}
			</ScrollView>

			<Button disabled={!canContinue || isSubmitting} onPress={goToNextStep}>
				{isSubmitting ? <ButtonSpinner /> : null}
				<ButtonText>Próxima</ButtonText>
			</Button>
		</View>
	);
}
