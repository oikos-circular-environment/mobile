import { and, eq, isNull } from "drizzle-orm";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import {
	ArrowLeftIcon,
	CircleCheckIcon,
	CircleDashedIcon,
	CircleDotDashedIcon,
	CircleXIcon,
	CopyIcon,
	Trash2Icon,
	UserRoundIcon,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
import { useSurveyContinue } from "@/components/survey/hooks/use-survey-continue";
import { useSurveyPersonaLabel } from "@/components/survey/hooks/use-survey-persona-label";
import { useSurveyProtocol } from "@/components/survey/hooks/use-survey-protocol";
import {
	SurveyInviteCard,
	SurveyInviteCardActions,
	SurveyInviteCardDescription,
	SurveyInviteCardHeader,
	SurveyInviteCardInfo,
	SurveyInviteCardInfoItem,
	SurveyInviteCardInfoItemContent,
	SurveyInviteCardInfoItemLabel,
	SurveyInviteCardInfoItemValue,
	SurveyInviteCardPersonaBadge,
	SurveyInviteCardStages,
	SurveyInviteCardTitle,
	type SurveyInviteStage,
} from "@/components/survey/survey-invite-card";
import { toast } from "@/components/toast";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { getSurveyDb } from "@/libs/survey/db/client";
import { surveyAnswer, surveySession } from "@/libs/survey/db/schema";
import { useSurveyExecutionStore } from "@/stores/survey-execution-store";
import { useSurveyStore } from "@/stores/survey-store";

type StageStatus = "done" | "in_progress" | "pending" | "abandoned";

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
	abandoned: {
		icon: CircleXIcon,
		color: colors.red[600],
		label: "Abandonada",
	},
};

export default function SurveyResumeScreen() {
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const { data: protocol } = useSurveyProtocol();
	const sessionId = useSurveyStore(s => s.sessionId);
	const status = useSurveyStore(s => s.status);
	const isTerminal = status === "ABANDONED" || status === "COMPLETED";

	const suiteQueue = useSurveyExecutionStore(s => s.suiteQueue);
	const suiteIndex = useSurveyExecutionStore(s => s.suiteIndex);
	const isActive = useSurveyExecutionStore(s => s.isActive);
	const handleContinue = useSurveyContinue();

	const deleteSheetRef = useRef<DeleteSurveyDataSheetHandle>(null);
	const abandonSheetRef = useRef<AbandonSurveySheetHandle>(null);
	const [participantCode, setParticipantCode] = useState<string | null>(null);
	const [hasClosingComment, setHasClosingComment] = useState(false);

	useEffect(() => {
		if (!sessionId) return;
		const db = getSurveyDb();
		db.select()
			.from(surveySession)
			.where(eq(surveySession.id, sessionId))
			.then(rows => setParticipantCode(rows[0]?.participantCode ?? null));

		db.select()
			.from(surveyAnswer)
			.where(
				and(
					eq(surveyAnswer.sessionId, sessionId),
					eq(surveyAnswer.questionKey, "free_comment"),
					isNull(surveyAnswer.suiteRunId),
				),
			)
			.then(rows => setHasClosingComment(rows.length > 0));
	}, [sessionId]);

	const personaLabel = useSurveyPersonaLabel();

	const handleCopyCode = async () => {
		if (!participantCode) return;
		await Clipboard.setStringAsync(participantCode);
		toast.success("Código copiado!");
	};

	const ctaLabel = isTerminal
		? status === "ABANDONED"
			? "Pesquisa abandonada"
			: "Pesquisa concluída"
		: "Continuar";

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
		const stageStatus: StageStatus =
			index < suiteIndex
				? "done"
				: index === suiteIndex
					? isActive
						? "in_progress"
						: status === "ABANDONED"
							? "abandoned"
							: "pending"
					: status === "ABANDONED"
						? "abandoned"
						: "pending";
		return {
			code: suiteCode,
			title: suite ? `${suiteCode} · ${suite.title}` : suiteCode,
			status: stageStatus,
		};
	});

	return (
		<View
			className="flex-1 bg-white px-6 pb-6 gap-5"
			style={{ paddingTop: insets.top + 16 }}
		>
			<View className="flex-row items-center gap-2.5">
				<Pressable onPress={() => router.back()} hitSlop={8}>
					<ArrowLeftIcon size={20} color={colors.gray[900]} />
				</Pressable>
				<Heading size="lg">Minha pesquisa</Heading>
			</View>

			<ScrollView contentContainerClassName="gap-6" className="flex-1">
				<SurveyInviteCard>
					<SurveyInviteCardHeader>
						{personaLabel ? (
							<SurveyInviteCardPersonaBadge>
								{personaLabel}
							</SurveyInviteCardPersonaBadge>
						) : null}
					</SurveyInviteCardHeader>
					<SurveyInviteCardTitle>Continue de onde parou</SurveyInviteCardTitle>
					<SurveyInviteCardDescription>
						{suiteQueue.length > 0
							? `Você está na Etapa ${suiteIndex + 1} de ${suiteQueue.length}.`
							: "Continue sua participação."}
					</SurveyInviteCardDescription>
					<SurveyInviteCardInfo>
						{personaLabel ? (
							<SurveyInviteCardInfoItem>
								<SurveyInviteCardInfoItemContent>
									<SurveyInviteCardInfoItemLabel>
										Seu perfil
									</SurveyInviteCardInfoItemLabel>
									<SurveyInviteCardInfoItemValue>
										{personaLabel}
									</SurveyInviteCardInfoItemValue>
								</SurveyInviteCardInfoItemContent>
								<UserRoundIcon size={18} color="#ffffffcc" />
							</SurveyInviteCardInfoItem>
						) : null}
						{participantCode ? (
							<SurveyInviteCardInfoItem onPress={handleCopyCode}>
								<SurveyInviteCardInfoItemContent>
									<SurveyInviteCardInfoItemLabel>
										Seu código
									</SurveyInviteCardInfoItemLabel>
									<SurveyInviteCardInfoItemValue>
										{participantCode}
									</SurveyInviteCardInfoItemValue>
								</SurveyInviteCardInfoItemContent>
								<CopyIcon size={16} color="#ffffffcc" />
							</SurveyInviteCardInfoItem>
						) : null}
					</SurveyInviteCardInfo>
					<SurveyInviteCardStages items={cardStages} />
					<SurveyInviteCardActions>
						<Button
							variant="secondary"
							className="flex-1 h-12"
							onPress={handleContinue}
							disabled={isTerminal}
						>
							<ButtonText>{ctaLabel}</ButtonText>
						</Button>
					</SurveyInviteCardActions>
				</SurveyInviteCard>

				<View className="gap-2.5">
					<Heading size="md">Etapas</Heading>

					<View className="gap-2">
						<Pressable
							className="flex-row items-center gap-3 rounded-lg bg-gray-50 p-3.5"
							onPress={() => router.push("/survey/characterization-answers")}
						>
							<CircleCheckIcon size={22} color={colors.lime[800]} />
							<View className="flex-1 gap-0.5">
								<Text size="sm" bold>
									Caracterização
								</Text>
								<Text size="xs" className="text-muted-foreground">
									Concluída · toque para ver respostas
								</Text>
							</View>
						</Pressable>

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
							{hasClosingComment ? (
								<CircleCheckIcon size={22} color={colors.lime[800]} />
							) : (
								<CircleDashedIcon size={22} color={colors.yellow[600]} />
							)}
							<View className="flex-1 gap-0.5">
								<Text size="sm" bold>
									Comentário final
								</Text>
								<Text size="xs" className="text-muted-foreground">
									{hasClosingComment
										? "Concluído"
										: "Pendente · disponível ao concluir tudo"}
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
					{!isTerminal ? (
						<SettingOptionRow
							icon={CircleXIcon}
							title="Abandonar a pesquisa"
							description="Você pode retomar depois de onde parou"
							tone="danger"
							onPress={() => abandonSheetRef.current?.open()}
						/>
					) : null}
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
