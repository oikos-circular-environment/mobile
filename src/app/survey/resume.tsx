import { eq } from "drizzle-orm";
import { useRouter } from "expo-router";
import {
	ArrowLeftIcon,
	CircleCheckIcon,
	CircleDashedIcon,
	CircleDotDashedIcon,
	CircleXIcon,
	Trash2Icon,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SettingOptionRow } from "@/components/settings/setting-option-row";
import { colors } from "@/components/style/colors";
import {
	AbandonSurveySheet,
	type AbandonSurveySheetHandle,
} from "@/components/survey/abandon-survey-sheet";
import {
	DeleteSurveyDataSheet,
	type DeleteSurveyDataSheetHandle,
} from "@/components/survey/delete-survey-data-sheet";
import { useSurveyProtocol } from "@/components/survey/hooks/use-survey-protocol";
import {
	SurveyInviteCard,
	type SurveyInviteStage,
} from "@/components/survey/survey-invite-card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { getSurveyDb } from "@/libs/survey/db/client";
import { surveySession } from "@/libs/survey/db/schema";
import { useSurveyExecutionStore } from "@/stores/survey-execution-store";
import { useSurveyStore } from "@/stores/survey-store";

type StageStatus = "done" | "in_progress" | "pending";

const STATUS_META: Record<
	StageStatus,
	{ icon: typeof CircleCheckIcon; color: string; label: string }
> = {
	done: {
		icon: CircleCheckIcon,
		color: colors.lime[800],
		label: "Concluída · toque para ver respostas",
	},
	in_progress: {
		icon: CircleDotDashedIcon,
		color: "#7DC4FA",
		label: "Em andamento",
	},
	pending: {
		icon: CircleDashedIcon,
		color: colors.yellow[600],
		label: "Pendente",
	},
};

export default function SurveyResumeScreen() {
	const router = useRouter();
	const { data: protocol } = useSurveyProtocol();
	const persona = useSurveyStore(s => s.persona);
	const sessionId = useSurveyStore(s => s.sessionId);

	const suiteQueue = useSurveyExecutionStore(s => s.suiteQueue);
	const suiteIndex = useSurveyExecutionStore(s => s.suiteIndex);
	const isActive = useSurveyExecutionStore(s => s.isActive);
	const setPaused = useSurveyExecutionStore(s => s.setPaused);

	const deleteSheetRef = useRef<DeleteSurveyDataSheetHandle>(null);
	const abandonSheetRef = useRef<AbandonSurveySheetHandle>(null);
	const [participantCode, setParticipantCode] = useState<string | null>(null);

	useEffect(() => {
		if (!sessionId) return;
		getSurveyDb()
			.select()
			.from(surveySession)
			.where(eq(surveySession.id, sessionId))
			.then(rows => setParticipantCode(rows[0]?.participantCode ?? null));
	}, [sessionId]);

	const personaLabel = protocol?.personas.find(p => p.key === persona)?.label;

	const handleContinue = () => {
		if (isActive) {
			setPaused(false);
			router.dismissTo("/(tabs)/(home)" as never);
		} else {
			router.replace("/survey/suite-intro");
		}
	};

	const cardStages: SurveyInviteStage[] = suiteQueue.map((code, index) => ({
		code,
		status:
			index < suiteIndex
				? "done"
				: index === suiteIndex
					? "current"
					: "upcoming",
		currentLabel: code,
	}));

	const stages = suiteQueue.map(suiteCode => {
		const suite = protocol?.suites.find(s => s.code === suiteCode);
		const index = suiteQueue.indexOf(suiteCode);
		const status: StageStatus =
			index < suiteIndex
				? "done"
				: index === suiteIndex && isActive
					? "in_progress"
					: "pending";
		return {
			code: suiteCode,
			title: suite ? `${suiteCode} · ${suite.title}` : suiteCode,
			status,
		};
	});

	return (
		<View className="flex-1 bg-white px-6 pb-6 pt-14 gap-5">
			<View className="flex-row items-center gap-2.5">
				<Pressable onPress={() => router.back()} hitSlop={8}>
					<ArrowLeftIcon size={20} color={colors.gray[900]} />
				</Pressable>
				<Heading size="lg">Minha pesquisa</Heading>
			</View>

			<ScrollView contentContainerClassName="gap-6" className="flex-1">
				<SurveyInviteCard
					title="Continue de onde parou"
					description={
						suiteQueue.length > 0
							? `Você está na Etapa ${suiteIndex + 1} de ${suiteQueue.length}.`
							: "Continue sua participação."
					}
					personaLabel={personaLabel}
					participantCode={participantCode ?? undefined}
					stages={cardStages.length > 0 ? cardStages : undefined}
					ctaLabel="Continuar"
					onPressCta={handleContinue}
				/>

				<View className="gap-2.5">
					<Heading size="md">Etapas</Heading>

					<View className="gap-2">
						<View className="flex-row items-center gap-3 rounded-lg bg-gray-50 p-3.5">
							<CircleCheckIcon size={22} color={colors.lime[800]} />
							<View className="flex-1 gap-0.5">
								<Text size="sm" bold>
									Caracterização
								</Text>
								<Text size="xs" className="text-muted-foreground">
									Concluída
								</Text>
							</View>
						</View>

						{stages.map(stage => {
							const meta = STATUS_META[stage.status];
							const StatusIcon = meta.icon;
							const Row = stage.status === "done" ? Pressable : View;
							return (
								<Row
									key={stage.code}
									className="flex-row items-center gap-3 rounded-lg bg-gray-50 p-3.5"
									{...(stage.status === "done"
										? {
												onPress: () =>
													router.push({
														pathname: "/survey/answers",
														params: { suiteCode: stage.code },
													} as never),
											}
										: {})}
								>
									<StatusIcon size={22} color={meta.color} />
									<View className="flex-1 gap-0.5">
										<Text size="sm" bold>
											{stage.title}
										</Text>
										<Text size="xs" className="text-muted-foreground">
											{meta.label}
										</Text>
									</View>
								</Row>
							);
						})}

						<View className="flex-row items-center gap-3 rounded-lg bg-gray-50 p-3.5">
							<CircleDashedIcon size={22} color={colors.yellow[600]} />
							<View className="flex-1 gap-0.5">
								<Text size="sm" bold>
									Comentário final
								</Text>
								<Text size="xs" className="text-muted-foreground">
									Pendente · disponível ao concluir tudo
								</Text>
							</View>
						</View>
					</View>
				</View>

				<View className="gap-2.5">
					<Heading size="md">Gerenciar pesquisa</Heading>
					<Text
						size="xs"
						bold
						className="uppercase tracking-wider text-muted-foreground"
					>
						Zona perigosa
					</Text>

					<SettingOptionRow
						icon={Trash2Icon}
						title="Solicitar exclusão dos meus dados"
						description="Apaga permanentemente suas respostas desta pesquisa"
						tone="danger"
						onPress={() => deleteSheetRef.current?.open()}
					/>
					<SettingOptionRow
						icon={CircleXIcon}
						title="Abandonar a pesquisa"
						description="Você pode retomar depois de onde parou"
						tone="danger"
						onPress={() => abandonSheetRef.current?.open()}
					/>
				</View>
			</ScrollView>

			<DeleteSurveyDataSheet
				ref={deleteSheetRef}
				participantCode={participantCode}
			/>
			<AbandonSurveySheet ref={abandonSheetRef} />
		</View>
	);
}
