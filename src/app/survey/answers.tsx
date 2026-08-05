import { and, eq } from "drizzle-orm";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeftIcon } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/components/style/colors";
import { useSurveyProtocol } from "@/components/survey/hooks/use-survey-protocol";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { getSurveyDb } from "@/libs/survey/db/client";
import { surveyAnswer, surveySuiteRun } from "@/libs/survey/db/schema";
import { useSurveyStore } from "@/stores/survey-store";

function formatTime(iso: string | null | undefined) {
	if (!iso) return "—";
	return new Date(iso).toLocaleTimeString("pt-BR", {
		hour: "2-digit",
		minute: "2-digit",
	});
}

function formatDuration(ms: number) {
	const minutes = Math.round(ms / 60000);
	return `${minutes} min`;
}

export default function SurveyAnswersScreen() {
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const { suiteCode } = useLocalSearchParams<{ suiteCode: string }>();
	const { data: protocol } = useSurveyProtocol();
	const sessionId = useSurveyStore(s => s.sessionId);

	const [suiteRun, setSuiteRun] = useState<
		typeof surveySuiteRun.$inferSelect | null
	>(null);
	const [answers, setAnswers] = useState<(typeof surveyAnswer.$inferSelect)[]>(
		[],
	);

	useEffect(() => {
		if (!sessionId || !suiteCode) return;

		const db = getSurveyDb();
		db.select()
			.from(surveySuiteRun)
			.where(
				and(
					eq(surveySuiteRun.sessionId, sessionId),
					eq(surveySuiteRun.suiteCode, suiteCode),
				),
			)
			.then(async rows => {
				const run = rows[0] ?? null;
				setSuiteRun(run);
				if (!run) return;
				const answerRows = await db
					.select()
					.from(surveyAnswer)
					.where(eq(surveyAnswer.suiteRunId, run.id));
				setAnswers(answerRows);
			});
	}, [sessionId, suiteCode]);

	const perSuiteQuestions =
		protocol?.questions
			.filter(q => q.scope === "PER_SUITE")
			.sort((a, b) => a.position - b.position) ?? [];

	const suiteIndex = protocol?.suites.findIndex(s => s.code === suiteCode) ?? 0;

	return (
		<View
			className="flex-1 bg-white px-6 pb-6 gap-4"
			style={{ paddingTop: insets.top + 16 }}
		>
			<View className="flex-row items-center gap-2.5">
				<Pressable onPress={() => router.back()} hitSlop={8}>
					<ArrowLeftIcon size={20} color={colors.gray[900]} />
				</Pressable>
				<Heading size="lg">{`Respostas · Etapa ${suiteIndex + 1}`}</Heading>
			</View>

			<View className="flex-row rounded-lg bg-gray-50 p-4">
				<View className="flex-1 gap-0.5">
					<Text
						size="xs"
						bold
						className="uppercase tracking-wide text-muted-foreground"
					>
						Início
					</Text>
					<Text size="sm" bold>
						{formatTime(suiteRun?.startedAt)}
					</Text>
				</View>
				<View className="flex-1 gap-0.5">
					<Text
						size="xs"
						bold
						className="uppercase tracking-wide text-muted-foreground"
					>
						Término
					</Text>
					<Text size="sm" bold>
						{formatTime(suiteRun?.finishedAt)}
					</Text>
				</View>
				<View className="flex-1 gap-0.5">
					<Text
						size="xs"
						bold
						className="uppercase tracking-wide text-muted-foreground"
					>
						Duração
					</Text>
					<Text size="sm" bold>
						{suiteRun ? formatDuration(suiteRun.activeMs) : "—"}
					</Text>
				</View>
			</View>

			<ScrollView contentContainerClassName="gap-2.5" className="flex-1">
				{perSuiteQuestions.map(question => {
					const answer = answers.find(a => a.questionKey === question.key);
					if (!answer) return null;
					const optionLabel = question.options?.find(
						o => o.key === answer.valueText || o.value === answer.valueNumber,
					)?.label;

					return (
						<View
							key={question.key}
							className="gap-1.5 rounded-lg bg-gray-50 p-3.5"
						>
							<Text size="sm" className="leading-5">
								{question.label}
							</Text>
							<View className="self-start rounded-full bg-lime-100 px-2.5 py-1">
								<Text size="xs" bold className="text-lime-800">
									{optionLabel ??
										answer.valueText ??
										String(answer.valueNumber)}
								</Text>
							</View>
						</View>
					);
				})}
			</ScrollView>

			<Text size="xs" className="text-center text-muted-foreground">
				Essas respostas não podem ser editadas.
			</Text>
		</View>
	);
}
