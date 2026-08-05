import {
	CircleCheckIcon,
	CircleDotDashedIcon,
	CircleIcon,
} from "lucide-react-native";
import { View } from "react-native";
import { colors } from "@/components/style/colors";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { cn } from "@/libs/utils";

export interface TaskCardChecklistItem {
	id: string;
	label: string;
	status: "done" | "current" | "pending";
}

interface TaskCardProps {
	currentTask: number;
	totalTasks: number;
	elapsedLabel: string;
	instruction: string;
	checklist: TaskCardChecklistItem[];
	allTasksCompleted?: boolean;
	onPause: () => void;
	onQuit: () => void;
	onNext?: () => void;
	className?: string;
}

export function TaskCard({
	currentTask,
	totalTasks,
	elapsedLabel,
	instruction,
	checklist,
	allTasksCompleted = false,
	onPause,
	onQuit,
	onNext,
	className,
}: TaskCardProps) {
	return (
		<Card className={className}>
			<View className="gap-4">
				<View className="flex-row items-center justify-between">
					<Text size="sm" bold className="text-muted-foreground">
						{allTasksCompleted
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
						<View key={item.id} className="flex-row items-center gap-2.5 py-2">
							{item.status === "done" ? (
								<CircleCheckIcon size={18} color={colors.lime[700]} />
							) : item.status === "current" ? (
								<CircleDotDashedIcon size={18} color="#7DC4FA" />
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
					))}
				</View>

				<View className="flex-row gap-3">
					<Button variant="outline" onPress={onPause} className="flex-1">
						<ButtonText>Pausar</ButtonText>
					</Button>
					{allTasksCompleted ? (
						<Button onPress={onNext} className="flex-1">
							<ButtonText>Próximo</ButtonText>
						</Button>
					) : (
						<Button variant="destructive" onPress={onQuit} className="flex-1">
							<ButtonText>Desistir</ButtonText>
						</Button>
					)}
				</View>
			</View>
		</Card>
	);
}
