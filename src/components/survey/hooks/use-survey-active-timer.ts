import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import {
	selectAllTasksResolved,
	useSurveyExecutionStore,
} from "@/stores/survey-execution-store";

const TICK_MS = 1000;

/**
 * Conta tempo ativo só enquanto o app está em primeiro plano, a etapa não está pausada, e
 * ainda há alguma tarefa em aberto. Sair do aplicativo nunca soma ao tempo de tarefa (M05).
 * Para de contar no instante em que a última tarefa vira terminal (done ou abandoned) —
 * não quando o questionário pós-suíte é enviado, que pode acontecer minutos depois.
 */
export function useSurveyActiveTimer() {
	const isActive = useSurveyExecutionStore(s => s.isActive);
	const isPaused = useSurveyExecutionStore(s => s.isPaused);
	const allTasksResolved = useSurveyExecutionStore(selectAllTasksResolved);
	const addActiveMs = useSurveyExecutionStore(s => s.addActiveMs);
	const appStateRef = useRef(AppState.currentState);

	useEffect(() => {
		const subscription = AppState.addEventListener("change", nextState => {
			appStateRef.current = nextState;
		});
		return () => subscription.remove();
	}, []);

	useEffect(() => {
		if (!isActive || isPaused || allTasksResolved) return;

		const interval = setInterval(() => {
			if (appStateRef.current === "active") {
				addActiveMs(TICK_MS);
			}
		}, TICK_MS);

		return () => clearInterval(interval);
	}, [isActive, isPaused, allTasksResolved, addActiveMs]);
}
