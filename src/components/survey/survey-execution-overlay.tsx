import * as Haptics from "expo-haptics";
import { useRouter, useSegments } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dimensions, Pressable, type ScrollView, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
	AttachStep,
	type SpotlightTour,
	SpotlightTourProvider,
	type TourState,
} from "react-native-spotlight-tour";
import { FloatingIndicator } from "@/components/survey/floating-indicator";
import { useSurveyActiveTimer } from "@/components/survey/hooks/use-survey-active-timer";
import { useSurveyParticipantCode } from "@/components/survey/hooks/use-survey-participant-code";
import { useSurveyTaskDetection } from "@/components/survey/hooks/use-survey-task-detection";
import { useSurveyTourSeen } from "@/components/survey/hooks/use-survey-tour-seen";
import {
	buildSurveyTourSteps,
	getSurveyTourStepIndex,
} from "@/components/survey/survey-execution-tour-steps";
import { TaskCard } from "@/components/survey/task-card";
import { toast } from "@/components/toast";
import { resolveTaskRun } from "@/libs/survey/task-run";
import {
	selectAllTasksResolved,
	selectCurrentTaskActiveMs,
	selectResolvedTaskCount,
	useSurveyExecutionStore,
} from "@/stores/survey-execution-store";
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
	const segments = useSegments();
	const insets = useSafeAreaInsets();
	const surveyStatus = useSurveyStore(s => s.status);
	const isActive = useSurveyExecutionStore(s => s.isActive);
	const isPaused = useSurveyExecutionStore(s => s.isPaused);
	const isExpanded = useSurveyExecutionStore(s => s.isExpanded);
	const tasks = useSurveyExecutionStore(s => s.tasks);
	const currentTaskIndex = useSurveyExecutionStore(s => s.currentTaskIndex);
	const suiteRunId = useSurveyExecutionStore(s => s.suiteRunId);
	const suiteActiveMs = useSurveyExecutionStore(s => s.suiteActiveMs);
	const allTasksResolved = useSurveyExecutionStore(selectAllTasksResolved);
	const resolvedCount = useSurveyExecutionStore(selectResolvedTaskCount);
	const setExpanded = useSurveyExecutionStore(s => s.setExpanded);
	const setPaused = useSurveyExecutionStore(s => s.setPaused);
	const skipCurrentTask = useSurveyExecutionStore(s => s.skipCurrentTask);
	const abandonCurrentTask = useSurveyExecutionStore(s => s.abandonCurrentTask);
	const abandonSuite = useSurveyExecutionStore(s => s.abandonSuite);

	useSurveyActiveTimer();
	useSurveyTaskDetection();

	const translateX = useSharedValue(0);
	const translateY = useSharedValue(0);
	const [baseX, setBaseX] = useState(INDICATOR_DEFAULT_X);
	const [baseY, setBaseY] = useState(INDICATOR_DEFAULT_Y);

	const prevResolvedRef = useRef(false);
	const skipNextCelebrationRef = useRef(false);

	const sessionId = useSurveyStore(s => s.sessionId);
	const participantCode = useSurveyParticipantCode(sessionId);
	const tourRef = useRef<SpotlightTour>(null);
	const {
		loaded: tourSeenLoaded,
		seen: hasSeenTour,
		markSeen,
	} = useSurveyTourSeen(participantCode);
	const [tourActive, setTourActive] = useState(false);
	const frozenAllTasksResolvedRef = useRef(allTasksResolved);
	if (!tourActive) {
		frozenAllTasksResolvedRef.current = allTasksResolved;
	}
	const effectiveAllTasksResolved = tourActive
		? frozenAllTasksResolvedRef.current
		: allTasksResolved;
	const checklistScrollRef = useRef<ScrollView>(null);
	const currentItemYRef = useRef(0);
	const scrollChecklistTo = useCallback(async (mode: "top" | "current") => {
		checklistScrollRef.current?.scrollTo({
			y: mode === "top" ? 0 : currentItemYRef.current,
			animated: false,
		});
		await new Promise<void>(resolve => setTimeout(resolve, 50));
	}, []);
	const tourSteps = useMemo(
		() =>
			buildSurveyTourSteps(
				{ setExpanded, scrollChecklistTo },
				effectiveAllTasksResolved,
			),
		[setExpanded, effectiveAllTasksResolved, scrollChecklistTo],
	);
	const tourStepIndex = useMemo(
		() => getSurveyTourStepIndex(effectiveAllTasksResolved),
		[effectiveAllTasksResolved],
	);
	const overlayEligible =
		surveyStatus === "IN_PROGRESS" &&
		isActive &&
		!isPaused &&
		segments[0] !== "survey";

	useEffect(() => {
		if (
			overlayEligible &&
			isExpanded &&
			tourSeenLoaded &&
			!hasSeenTour &&
			participantCode
		) {
			markSeen();
			setTourActive(true);
			tourRef.current?.start();
		}
	}, [
		overlayEligible,
		isExpanded,
		tourSeenLoaded,
		hasSeenTour,
		participantCode,
		markSeen,
	]);

	const handleTourStop = (_values: TourState) => {
		setTourActive(false);
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: reseta o estado do tour só quando a sessão muda
	useEffect(() => {
		setTourActive(false);
		frozenAllTasksResolvedRef.current = allTasksResolved;
	}, [sessionId]);

	useEffect(() => {
		if (allTasksResolved && !prevResolvedRef.current) {
			if (!skipNextCelebrationRef.current) {
				Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
				toast.success("Você concluiu as tarefas desta etapa!");
				setExpanded(true);
			}
			skipNextCelebrationRef.current = false;
		}
		prevResolvedRef.current = allTasksResolved;
	}, [allTasksResolved, setExpanded]);

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
			runOnJS(setBaseX)(nextX);
			runOnJS(setBaseY)(nextY);
		});

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [
			{ translateX: baseX + translateX.value },
			{ translateY: baseY + translateY.value },
		],
	}));

	if (!overlayEligible) {
		return null;
	}

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

	const handleRepeatTour = () => {
		setTourActive(true);
		tourRef.current?.start();
	};

	const handleSkipTask = () => {
		skipCurrentTask();
	};

	const handleAbandonTask = async () => {
		if (!currentTask) return;
		if (suiteRunId) {
			// Modo de falha aceito: se a gravação local falhar, a ação do participante
			// ainda avança — o outcome sai como "não gravado" em vez de travar a suíte.
			await resolveTaskRun(
				suiteRunId,
				currentTask.code,
				currentTask.position,
				"NO",
				selectCurrentTaskActiveMs(useSurveyExecutionStore.getState()),
			).catch(() => {});
		}
		abandonCurrentTask();
	};

	const handleAbandonSuite = async () => {
		skipNextCelebrationRef.current = true;
		if (suiteRunId) {
			const toResolve = tasks.filter(
				t => t.status !== "done" && t.status !== "abandoned",
			);
			const openTaskActiveMs = selectCurrentTaskActiveMs(
				useSurveyExecutionStore.getState(),
			);
			await Promise.all(
				toResolve.map(t =>
					resolveTaskRun(
						suiteRunId,
						t.code,
						t.position,
						"NO",
						t.code === currentTask?.code ? openTaskActiveMs : 0,
					).catch(() => {}),
				),
			);
		}
		abandonSuite();
		router.push("/survey/questionnaire");
	};

	return (
		<SpotlightTourProvider
			ref={tourRef}
			steps={tourSteps}
			shape="rectangle"
			onBackdropPress="continue"
			shift={{ padding: 16 }}
			onStop={handleTourStop}
		>
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
							style={{
								position: "absolute",
								left: 20,
								right: 20,
								top: insets.top + 32,
								// bottom: insets.bottom + 32,
							}}
						>
							{allTasksResolved ? (
								<TaskCard
									currentTask={resolvedCount}
									totalTasks={tasks.length}
									elapsedLabel={formatElapsed(suiteActiveMs)}
									instruction="Você chegou ao fim das tarefas desta etapa. Toque em Próximo para responder o questionário rápido sobre ela."
									checklist={checklist}
									allTasksResolved
									onPause={handlePause}
									onRepeatTour={handleRepeatTour}
									onMinimize={() => setExpanded(false)}
									tourStepIndex={tourStepIndex}
									onNext={() => router.push("/survey/questionnaire")}
									onAbandonSuite={handleAbandonSuite}
									checklistScrollRef={checklistScrollRef}
									onCurrentItemLayoutY={y => {
										currentItemYRef.current = y;
									}}
								/>
							) : currentTask ? (
								<TaskCard
									currentTask={resolvedCount + 1}
									totalTasks={tasks.length}
									elapsedLabel={formatElapsed(suiteActiveMs)}
									instruction={currentTask.instruction}
									checklist={checklist}
									onPause={handlePause}
									onRepeatTour={handleRepeatTour}
									onMinimize={() => setExpanded(false)}
									tourStepIndex={tourStepIndex}
									onSkipTask={handleSkipTask}
									onAbandonTask={handleAbandonTask}
									onAbandonSuite={handleAbandonSuite}
									checklistScrollRef={checklistScrollRef}
									onCurrentItemLayoutY={y => {
										currentItemYRef.current = y;
									}}
								/>
							) : null}
						</Pressable>
					</Pressable>
				) : (
					<GestureDetector gesture={panGesture}>
						<Animated.View style={[{ position: "absolute" }, animatedStyle]}>
							<AttachStep index={tourStepIndex.FLOATING_PILL}>
								<View>
									<FloatingIndicator
										completedCount={resolvedCount}
										totalCount={tasks.length}
										elapsedLabel={formatElapsed(suiteActiveMs)}
										onPress={() => setExpanded(true)}
									/>
								</View>
							</AttachStep>
						</Animated.View>
					</GestureDetector>
				)}
			</View>
		</SpotlightTourProvider>
	);
}
