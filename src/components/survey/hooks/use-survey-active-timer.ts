import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useSurveyExecutionStore } from "@/stores/survey-execution-store";

const TICK_MS = 1000;

/**
 * Conta tempo ativo só enquanto o app está em primeiro plano e a etapa não está
 * pausada. Sair do aplicativo nunca soma ao tempo de tarefa (M05).
 */
export function useSurveyActiveTimer() {
	const isActive = useSurveyExecutionStore(s => s.isActive);
	const isPaused = useSurveyExecutionStore(s => s.isPaused);
	const addActiveMs = useSurveyExecutionStore(s => s.addActiveMs);
	const appStateRef = useRef(AppState.currentState);

	useEffect(() => {
		const subscription = AppState.addEventListener("change", nextState => {
			appStateRef.current = nextState;
		});
		return () => subscription.remove();
	}, []);

	useEffect(() => {
		if (!isActive || isPaused) return;

		const interval = setInterval(() => {
			if (appStateRef.current === "active") {
				addActiveMs(TICK_MS);
			}
		}, TICK_MS);

		return () => clearInterval(interval);
	}, [isActive, isPaused, addActiveMs]);
}
