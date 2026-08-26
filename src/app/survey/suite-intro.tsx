import { and, eq } from "drizzle-orm";
import * as Crypto from "expo-crypto";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
	AppButton as Button,
	AppButtonText as ButtonText,
} from "@/components/app-button";
import { useSurveyProtocol } from "@/components/survey/hooks/use-survey-protocol";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { getSurveyDb } from "@/libs/survey/db/client";
import { surveySuiteRun } from "@/libs/survey/db/schema";
import { start as startEventRecorder } from "@/libs/survey/event-recorder";
import { useSurveyExecutionStore } from "@/stores/survey-execution-store";
import { useSurveyStore } from "@/stores/survey-store";

/** Tempo mínimo antes de liberar "Começar" — força uma leitura do objetivo em vez de
 *  deixar o participante pular direto pro toque de hábito. */
const BEGIN_BUTTON_HOLD_MS = 3000;

export default function SurveySuiteIntroScreen() {
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const { data: protocol } = useSurveyProtocol();
	const persona = useSurveyStore(s => s.persona);
	const setProgress = useSurveyStore(s => s.setProgress);

	const suiteQueue = useSurveyExecutionStore(s => s.suiteQueue);
	const suiteIndex = useSurveyExecutionStore(s => s.suiteIndex);
	const suiteTitle = useSurveyExecutionStore(s => s.suiteTitle);
	const suiteObjective = useSurveyExecutionStore(s => s.suiteObjective);
	const suiteSpecificObjectives = useSurveyExecutionStore(
		s => s.suiteSpecificObjectives,
	);
	const tasks = useSurveyExecutionStore(s => s.tasks);
	const initRoteiro = useSurveyExecutionStore(s => s.initRoteiro);
	const openSuiteIntro = useSurveyExecutionStore(s => s.openSuiteIntro);
	const beginSuite = useSurveyExecutionStore(s => s.beginSuite);
	const setSuiteRunId = useSurveyExecutionStore(s => s.setSuiteRunId);
	const sessionId = useSurveyStore(s => s.sessionId);

	const personaDefinition = useMemo(
		() => protocol?.personas.find(p => p.key === persona),
		[protocol, persona],
	);

	useEffect(() => {
		if (suiteQueue.length === 0 && personaDefinition) {
			initRoteiro(personaDefinition.suites.map(s => s.suite_code));
		}
	}, [suiteQueue.length, personaDefinition, initRoteiro]);

	const suiteCode = suiteQueue[suiteIndex];

	useEffect(() => {
		if (!protocol || !suiteCode || !personaDefinition) return;

		const suite = protocol.suites.find(s => s.code === suiteCode);
		if (!suite) return;

		const personaSuite = personaDefinition.suites.find(
			s => s.suite_code === suiteCode,
		);

		openSuiteIntro({
			code: suite.code,
			title: suite.title,
			objective: suite.objective,
			specificObjectives: personaSuite?.specific_objectives ?? [],
			tasks: suite.task_codes.map(taskCode => {
				const task = protocol.tasks.find(t => t.code === taskCode);
				return {
					code: taskCode,
					title: task?.title ?? taskCode,
					instruction: task?.instruction ?? "",
				};
			}),
		});
	}, [protocol, suiteCode, personaDefinition, openSuiteIntro]);

	const holdSeconds = BEGIN_BUTTON_HOLD_MS / 1000;
	const [secondsLeft, setSecondsLeft] = useState(holdSeconds);

	// biome-ignore lint/correctness/useExhaustiveDependencies: suiteCode não é lido aqui, só reinicia a contagem quando a etapa muda
	useEffect(() => {
		setSecondsLeft(holdSeconds);
		const interval = setInterval(() => {
			setSecondsLeft(current => {
				if (current <= 1) {
					clearInterval(interval);
					return 0;
				}
				return current - 1;
			});
		}, 1000);
		return () => clearInterval(interval);
	}, [suiteCode, holdSeconds]);

	const handleBegin = async () => {
		let suiteRunId: string | null = null;
		if (sessionId && suiteCode) {
			const db = getSurveyDb();
			const [existing] = await db
				.select({ id: surveySuiteRun.id })
				.from(surveySuiteRun)
				.where(
					and(
						eq(surveySuiteRun.sessionId, sessionId),
						eq(surveySuiteRun.suiteCode, suiteCode),
					),
				)
				.limit(1);

			if (existing) {
				suiteRunId = existing.id;
			} else {
				suiteRunId = Crypto.randomUUID();
				const now = new Date().toISOString();
				await db.insert(surveySuiteRun).values({
					id: suiteRunId,
					sessionId,
					suiteCode,
					position: suiteIndex,
					startedAt: now,
				});
			}
			setSuiteRunId(suiteRunId);
		}

		beginSuite();
		if (sessionId && suiteRunId) {
			startEventRecorder(sessionId, suiteRunId);
		}
		setProgress(suiteCode ?? null, tasks[0]?.code ?? null);
		router.dismissTo("/(tabs)/(home)" as never);
	};

	if (!suiteTitle) {
		return <View className="flex-1 bg-white" />;
	}

	return (
		<View
			className="flex-1 bg-white px-6"
			style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }}
		>
			{/* Os objetivos por persona chegam a 4 passos e não cabem em uma tela;
			    sem o scroll, o texto do fim ficava inacessível. */}
			<ScrollView
				className="flex-1"
				contentContainerClassName="gap-4 pb-6"
				showsVerticalScrollIndicator={false}
			>
				<Text size="xs" bold className="uppercase tracking-wider text-lime-700">
					{`Etapa ${suiteIndex + 1} de ${suiteQueue.length}`}
				</Text>
				<Heading size="2xl">{suiteTitle}</Heading>
				<Text className="leading-6">{suiteObjective}</Text>

				{suiteSpecificObjectives.length > 0 ? (
					<View className="gap-2 pt-2">
						<Text size="sm" bold>
							Objetivos Específicos
						</Text>
						{suiteSpecificObjectives.map((item, index) => (
							<View
								key={item}
								className="flex-row items-start gap-3 rounded-xl border border-gray-200 p-3"
							>
								<View className="h-6 w-6 items-center justify-center rounded-full bg-lime-800">
									<Text size="xs" bold className="text-white">
										{index + 1}
									</Text>
								</View>
								<Text className="flex-1 leading-6">{item}</Text>
							</View>
						))}
					</View>
				) : null}
			</ScrollView>

			<Button onPress={handleBegin} disabled={secondsLeft > 0}>
				<ButtonText>
					{secondsLeft > 0 ? `Começar (${secondsLeft})` : "Começar"}
				</ButtonText>
			</Button>
		</View>
	);
}
