import {
	CircleCheckIcon,
	CircleDotDashedIcon,
	CircleIcon,
	CircleSlashIcon,
	CircleXIcon,
	MinimizeIcon,
	RotateCcwIcon,
} from "lucide-react-native";
import type { RefObject } from "react";
import { Fragment } from "react";
import { ScrollView, View } from "react-native";
import { AttachStep } from "react-native-spotlight-tour";
import { colors } from "@/components/style/colors";
import {
	getSurveyTourStepIndex,
	type SurveyTourStepIndex,
} from "@/components/survey/survey-execution-tour-steps";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { cn } from "@/libs/utils";

export interface TaskCardChecklistItem {
	id: string;
	label: string;
	status: "done" | "current" | "pending" | "skipped" | "abandoned";
}

interface TaskCardProps {
	currentTask: number;
	totalTasks: number;
	elapsedLabel: string;
	instruction: string;
	checklist: TaskCardChecklistItem[];
	allTasksResolved?: boolean;
	onPause: () => void;
	/** Bottom-row action — mesmo botão que hoje troca com "Próximo" conforme o
	 *  progresso das tarefas, agora abandonando a suíte atual em vez de navegar
	 *  pro dashboard. */
	onAbandonSuite: () => void;
	onNext?: () => void;
	onSkipTask?: () => void;
	onAbandonTask?: () => void;
	onRepeatTour: () => void;
	onMinimize: () => void;
	tourStepIndex?: SurveyTourStepIndex;
	className?: string;
	checklistScrollRef?: RefObject<ScrollView | null>;
	onCurrentItemLayoutY?: (y: number) => void;
}

const DEFAULT_TOUR_STEP_INDEX = getSurveyTourStepIndex(false);

export function TaskCard({
	currentTask,
	totalTasks,
	elapsedLabel,
	instruction,
	checklist,
	allTasksResolved = false,
	onPause,
	onAbandonSuite,
	onNext,
	onSkipTask,
	onAbandonTask,
	onRepeatTour,
	onMinimize,
	tourStepIndex = DEFAULT_TOUR_STEP_INDEX,
	className,
	checklistScrollRef,
	onCurrentItemLayoutY,
}: TaskCardProps) {
	return (
		<Card className={cn("flex-1 overflow-hidden", className)}>
			<View
				className="gap-4"
				style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0, minHeight: 0 }}
			>
				<View className="gap-4" style={{ flexShrink: 0 }}>
					<View className="flex-row items-center justify-between">
						<Text size="sm" bold className="text-muted-foreground">
							{allTasksResolved
								? `${totalTasks} de ${totalTasks} concluídas`
								: `Tarefa ${currentTask} de ${totalTasks}`}
						</Text>
						<AttachStep
							index={tourStepIndex.TIMER}
							style={{ alignSelf: "center" }}
						>
							<Text size="sm" className="text-muted-foreground">
								{elapsedLabel}
							</Text>
						</AttachStep>
					</View>

					<View className="flex-row gap-2">
						<Button
							variant="secondary"
							onPress={onRepeatTour}
							className="flex-1"
						>
							<ButtonText>Repetir tutorial</ButtonText>
							<ButtonIcon as={RotateCcwIcon} />
						</Button>
						<AttachStep index={tourStepIndex.MINIMIZE} fill>
							<Button
								variant="secondary"
								onPress={onMinimize}
								className="flex-1"
							>
								<ButtonText>Minimizar</ButtonText>
								<ButtonIcon as={MinimizeIcon} />
							</Button>
						</AttachStep>
					</View>

					<Text size="md" className="font-medium leading-5 text-justify">
						{instruction}
					</Text>
				</View>

				<ScrollView
					ref={checklistScrollRef}
					style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0, minHeight: 0 }}
				>
					<AttachStep index={tourStepIndex.CHECKLIST} fill>
						<View className="gap-0.5">
							<Text
								size="xs"
								bold
								className="mb-1 uppercase text-muted-foreground"
							>
								Tarefas desta etapa
							</Text>

							{checklist.map(item => (
								<Fragment key={item.id}>
									<View
										className="flex-row items-center gap-2.5 py-2"
										onLayout={event => {
											if (item.status === "current") {
												onCurrentItemLayoutY?.(event.nativeEvent.layout.y);
											}
										}}
									>
										{item.status === "done" ? (
											<CircleCheckIcon size={18} color={colors.lime[700]} />
										) : item.status === "current" ? (
											<CircleDotDashedIcon size={18} color="#7DC4FA" />
										) : item.status === "abandoned" ? (
											<CircleXIcon size={18} color={colors.red[600]} />
										) : item.status === "skipped" ? (
											<CircleSlashIcon size={18} color={colors.yellow[600]} />
										) : (
											<CircleIcon size={18} color={colors.gray[300]} />
										)}
										<Text
											size="sm"
											bold={item.status === "current"}
											className={cn(
												"flex-1",
												item.status === "pending" && "text-muted-foreground",
											)}
										>
											{item.label}
										</Text>
									</View>

									{item.status === "current" && onSkipTask && onAbandonTask ? (
										<AttachStep
											index={tourStepIndex.SKIP_OR_ABANDON_TASK as number}
											fill
										>
											<View className="flex-row gap-3 pb-2">
												<Button
													variant="destructive"
													onPress={onAbandonTask}
													size="sm"
													className="flex-1"
												>
													<ButtonText>Abandonar</ButtonText>
												</Button>
												<Button
													variant="outline"
													onPress={onSkipTask}
													size="sm"
													className="flex-1"
												>
													<ButtonText>Pular</ButtonText>
												</Button>
											</View>
										</AttachStep>
									) : null}
								</Fragment>
							))}
						</View>
					</AttachStep>
				</ScrollView>

				<View className="flex-row gap-3" style={{ flexShrink: 0 }}>
					<AttachStep index={tourStepIndex.PAUSE} style={{ flex: 1 }}>
						<Button variant="outline" onPress={onPause} className="flex-1">
							<ButtonText>Pausar</ButtonText>
						</Button>
					</AttachStep>
					{allTasksResolved ? (
						<Button onPress={onNext} className="flex-1">
							<ButtonText>Próximo</ButtonText>
						</Button>
					) : (
						<AttachStep
							index={tourStepIndex.ABANDON_SUITE as number}
							style={{ flex: 1 }}
						>
							<Button
								variant="destructive"
								onPress={onAbandonSuite}
								className="flex-1"
							>
								<ButtonText>Abandonar</ButtonText>
							</Button>
						</AttachStep>
					)}
				</View>
			</View>
		</Card>
	);
}
