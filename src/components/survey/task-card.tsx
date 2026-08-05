import {
	CircleCheckIcon,
	CircleDotDashedIcon,
	CircleIcon,
	CircleSlashIcon,
	CircleXIcon,
} from "lucide-react-native";
import { Fragment } from "react";
import { View } from "react-native";
import { colors } from "@/components/style/colors";
import { Button, ButtonText } from "@/components/ui/button";
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
	className?: string;
}

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
	className,
}: TaskCardProps) {
	return (
		<Card className={className}>
			<View className="gap-4">
				<View className="flex-row items-center justify-between">
					<Text size="sm" bold className="text-muted-foreground">
						{allTasksResolved
							? `${totalTasks} de ${totalTasks} concluídas`
							: `Tarefa ${currentTask} de ${totalTasks}`}
					</Text>
					<Text size="sm" className="text-muted-foreground">
						{elapsedLabel}
					</Text>
				</View>

				<Text size="md" className="font-medium leading-5">
					{instruction}
				</Text>

				<View className="gap-0.5">
					<Text size="xs" bold className="mb-1 uppercase text-muted-foreground">
						Tarefas desta etapa
					</Text>

					{checklist.map(item => (
						<Fragment key={item.id}>
							<View className="flex-row items-center gap-2.5 py-2">
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
								<View className="flex-row gap-3 pb-2">
									<Button
										variant="destructive"
										onPress={onAbandonTask}
										className="flex-1"
									>
										<ButtonText>Abandonar</ButtonText>
									</Button>
									<Button
										variant="outline"
										onPress={onSkipTask}
										className="flex-1"
									>
										<ButtonText>Pular</ButtonText>
									</Button>
								</View>
							) : null}
						</Fragment>
					))}
				</View>

				<View className="flex-row gap-3">
					<Button variant="outline" onPress={onPause} className="flex-1">
						<ButtonText>Pausar</ButtonText>
					</Button>
					{allTasksResolved ? (
						<Button onPress={onNext} className="flex-1">
							<ButtonText>Próximo</ButtonText>
						</Button>
					) : (
						<Button
							variant="destructive"
							onPress={onAbandonSuite}
							className="flex-1"
						>
							<ButtonText>Abandonar</ButtonText>
						</Button>
					)}
				</View>
			</View>
		</Card>
	);
}
