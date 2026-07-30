import * as Crypto from "expo-crypto";
import { useRouter } from "expo-router";
import { useEffect, useMemo } from "react";
import { View } from "react-native";
import { useSurveyProtocol } from "@/components/survey/hooks/use-survey-protocol";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { getSurveyDb } from "@/libs/survey/db/client";
import { surveySuiteRun } from "@/libs/survey/db/schema";
import { useSurveyExecutionStore } from "@/stores/survey-execution-store";
import { useSurveyStore } from "@/stores/survey-store";

export default function SurveySuiteIntroScreen() {
	const router = useRouter();
	const { data: protocol } = useSurveyProtocol();
	const persona = useSurveyStore(s => s.persona);
	const setProgress = useSurveyStore(s => s.setProgress);

	const suiteQueue = useSurveyExecutionStore(s => s.suiteQueue);
	const suiteIndex = useSurveyExecutionStore(s => s.suiteIndex);
	const suiteTitle = useSurveyExecutionStore(s => s.suiteTitle);
	const suiteObjective = useSurveyExecutionStore(s => s.suiteObjective);
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
			initRoteiro(personaDefinition.suite_codes);
		}
	}, [suiteQueue.length, personaDefinition, initRoteiro]);

	const suiteCode = suiteQueue[suiteIndex];

	useEffect(() => {
		if (!protocol || !suiteCode) return;

		const suite = protocol.suites.find(s => s.code === suiteCode);
		if (!suite) return;

		openSuiteIntro({
			code: suite.code,
			title: suite.title,
			objective: suite.objective,
			tasks: suite.task_codes.map(taskCode => {
				const task = protocol.tasks.find(t => t.code === taskCode);
				return {
					code: taskCode,
					title: task?.title ?? taskCode,
					instruction: task?.instruction ?? "",
				};
			}),
		});
	}, [protocol, suiteCode, openSuiteIntro]);

	const handleBegin = async () => {
		if (sessionId && suiteCode) {
			const suiteRunId = Crypto.randomUUID();
			const now = new Date().toISOString();
			await getSurveyDb().insert(surveySuiteRun).values({
				id: suiteRunId,
				sessionId,
				suiteCode,
				position: suiteIndex,
				startedAt: now,
			});
			setSuiteRunId(suiteRunId);
		}

		beginSuite();
		setProgress(suiteCode ?? null, tasks[0]?.code ?? null);
		router.dismissTo("/(tabs)/(home)" as never);
	};

	if (!suiteTitle) {
		return <View className="flex-1 bg-white" />;
	}

	return (
		<View className="flex-1 bg-white px-6 pb-8 pt-14 justify-between">
			<View className="gap-4">
				<Text size="xs" bold className="uppercase tracking-wider text-lime-700">
					{`Etapa ${suiteIndex + 1} de ${suiteQueue.length}`}
				</Text>
				<Heading size="2xl">{suiteTitle}</Heading>
				<Text className="leading-6">{suiteObjective}</Text>
			</View>

			<Button onPress={handleBegin}>
				<ButtonText>Começar</ButtonText>
			</Button>
		</View>
	);
}
