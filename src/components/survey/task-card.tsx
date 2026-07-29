import { CircleIcon } from "lucide-react-native";
import type { ComponentType } from "react";
import { View } from "react-native";
import { colors } from "@/components/style/colors";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";

export interface TaskCardChecklistItem {
	id: string;
	label: string;
	icon?: ComponentType<{ size?: number; color?: string }>;
}

interface TaskCardProps {
	currentTask: number;
	totalTasks: number;
	elapsedLabel: string;
	instruction: string;
	checklist: TaskCardChecklistItem[];
	onPause: () => void;
	onQuit: () => void;
	className?: string;
}

export function TaskCard({
	currentTask,
	totalTasks,
	elapsedLabel,
	instruction,
	checklist,
	onPause,
	onQuit,
	className,
}: TaskCardProps) {
	return (
		<Card className={className}>
			<View className="gap-4">
				<View className="flex-row items-center justify-between">
					<Text size="sm" className="text-muted-foreground">
						{`Tarefa ${currentTask} de ${totalTasks}`}
					</Text>
					<Text size="sm" className="text-muted-foreground">
						{elapsedLabel}
					</Text>
				</View>

				<Text size="md">{instruction}</Text>

				<View className="gap-2">
					<Text size="xs" bold className="uppercase text-muted-foreground">
						Tarefas desta etapa
					</Text>

					{checklist.map(item => {
						const ItemIcon = item.icon ?? CircleIcon;
						return (
							<View key={item.id} className="flex-row items-center gap-2">
								<ItemIcon size={18} color={colors.gray[400]} />
								<Text size="sm" className="flex-1">
									{item.label}
								</Text>
							</View>
						);
					})}
				</View>

				<View className="flex-row gap-3">
					<Button variant="outline" onPress={onPause} className="flex-1">
						<ButtonText>Pausar</ButtonText>
					</Button>
					<Button variant="destructive" onPress={onQuit} className="flex-1">
						<ButtonText>Desistir</ButtonText>
					</Button>
				</View>
			</View>
		</Card>
	);
}
