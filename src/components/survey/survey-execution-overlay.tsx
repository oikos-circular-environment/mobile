import { useRouter } from "expo-router";
import { useState } from "react";
import { Dimensions, Pressable, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
} from "react-native-reanimated";
import { FloatingIndicator } from "@/components/survey/floating-indicator";
import { useSurveyActiveTimer } from "@/components/survey/hooks/use-survey-active-timer";
import { useSurveyTaskDetection } from "@/components/survey/hooks/use-survey-task-detection";
import { TaskCard } from "@/components/survey/task-card";
import { useSurveyExecutionStore } from "@/stores/survey-execution-store";
import { useSurveyStore } from "@/stores/survey-store";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const INDICATOR_DEFAULT_X = SCREEN_WIDTH - 140;
const INDICATOR_DEFAULT_Y = 70;

function formatElapsed(ms: number) {
	const totalSeconds = Math.floor(ms / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function SurveyExecutionOverlay() {
	const router = useRouter();
	const surveyStatus = useSurveyStore(s => s.status);
	const isActive = useSurveyExecutionStore(s => s.isActive);
	const isPaused = useSurveyExecutionStore(s => s.isPaused);
	const isExpanded = useSurveyExecutionStore(s => s.isExpanded);
	const tasks = useSurveyExecutionStore(s => s.tasks);
	const currentTaskIndex = useSurveyExecutionStore(s => s.currentTaskIndex);
	const suiteActiveMs = useSurveyExecutionStore(s => s.suiteActiveMs);
	const setExpanded = useSurveyExecutionStore(s => s.setExpanded);
	const setPaused = useSurveyExecutionStore(s => s.setPaused);

	useSurveyActiveTimer();
	useSurveyTaskDetection();

	const translateX = useSharedValue(0);
	const translateY = useSharedValue(0);
	const [baseX, setBaseX] = useState(INDICATOR_DEFAULT_X);
	const [baseY, setBaseY] = useState(INDICATOR_DEFAULT_Y);

	const panGesture = Gesture.Pan()
		.onUpdate(e => {
			translateX.value = e.translationX;
			translateY.value = e.translationY;
		})
		.onEnd(e => {
			const nextX = Math.max(
				8,
				Math.min(SCREEN_WIDTH - 128, baseX + e.translationX),
			);
			const nextY = Math.max(
				40,
				Math.min(SCREEN_HEIGHT - 120, baseY + e.translationY),
			);
			translateX.value = 0;
			translateY.value = 0;
			setBaseX(nextX);
			setBaseY(nextY);
		});

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [
			{ translateX: baseX + translateX.value },
			{ translateY: baseY + translateY.value },
		],
	}));

	if (surveyStatus !== "IN_PROGRESS" || !isActive || isPaused) {
		return null;
	}

	const allTasksCompleted =
		tasks.length > 0 && tasks.every(task => task.status === "done");
	const currentTask = tasks[currentTaskIndex];
	const checklist = tasks.map(task => ({
		id: task.code,
		label: task.title,
		status: task.status,
	}));

	const handlePause = () => {
		setPaused(true);
		setExpanded(false);
	};

	const handleQuit = () => {
		router.push("/survey/resume" as never);
	};

	return (
		<View
			pointerEvents="box-none"
			style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
		>
			{isExpanded ? (
				<Pressable
					onPress={() => setExpanded(false)}
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: "#00000055",
					}}
				>
					<Pressable
						onPress={event => event.stopPropagation()}
						style={{ position: "absolute", left: 20, right: 20, top: 180 }}
					>
						{allTasksCompleted ? (
							<TaskCard
								currentTask={tasks.length}
								totalTasks={tasks.length}
								elapsedLabel={formatElapsed(suiteActiveMs)}
								instruction="Você concluiu todas as tarefas desta etapa. Toque em Próximo para responder o questionário rápido sobre ela."
								checklist={checklist}
								allTasksCompleted
								onPause={handlePause}
								onQuit={handleQuit}
								onNext={() => router.push("/survey/questionnaire")}
							/>
						) : currentTask ? (
							<TaskCard
								currentTask={currentTaskIndex + 1}
								totalTasks={tasks.length}
								elapsedLabel={formatElapsed(suiteActiveMs)}
								instruction={currentTask.instruction}
								checklist={checklist}
								onPause={handlePause}
								onQuit={handleQuit}
							/>
						) : null}
					</Pressable>
				</Pressable>
			) : (
				<GestureDetector gesture={panGesture}>
					<Animated.View style={[{ position: "absolute" }, animatedStyle]}>
						<FloatingIndicator
							completedCount={currentTaskIndex}
							totalCount={tasks.length}
							elapsedLabel={formatElapsed(suiteActiveMs)}
							onPress={() => setExpanded(true)}
						/>
					</Animated.View>
				</GestureDetector>
			)}
		</View>
	);
}
