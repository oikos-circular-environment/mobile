import { createElement } from "react";
import type { TourStep } from "react-native-spotlight-tour";
import { SurveyTourTooltip } from "@/components/survey/survey-tour-tooltip";

export interface SurveyTourStepIndex {
	CHECKLIST: number;
	TIMER: number;
	PAUSE: number;
	SKIP_OR_ABANDON_TASK?: number;
	ABANDON_SUITE?: number;
	FLOATING_PILL: number;
}

/**
 * Passos `SKIP_OR_ABANDON_TASK` e `ABANDON_SUITE` só existem no tour quando há
 * uma tarefa atual (`!allTasksResolved`) — os `AttachStep` correspondentes em
 * `task-card.tsx` só montam nesse caso. Com todas as tarefas resolvidas, esses
 * dois passos ficam de fora e os índices dos demais passos se reajustam.
 */
export function getSurveyTourStepIndex(
	allTasksResolved: boolean,
): SurveyTourStepIndex {
	if (allTasksResolved) {
		return { CHECKLIST: 0, TIMER: 1, PAUSE: 2, FLOATING_PILL: 3 };
	}
	return {
		CHECKLIST: 0,
		TIMER: 1,
		PAUSE: 2,
		SKIP_OR_ABANDON_TASK: 3,
		ABANDON_SUITE: 4,
		FLOATING_PILL: 5,
	};
}

/** Contagem de passos do tour padrão (sem todas as tarefas resolvidas). */
export const TOUR_STEP_COUNT = 6;

const TOUR_STEP_TEXT: Record<keyof SurveyTourStepIndex, string> = {
	CHECKLIST:
		"Aqui estão as tarefas desta etapa. Acompanhe o progresso de cada uma.",
	TIMER: "Este é o tempo que você está gastando nesta etapa.",
	PAUSE: "Precisa parar? Toque em Pausar para continuar depois.",
	SKIP_OR_ABANDON_TASK:
		"Não consegue fazer esta tarefa agora? Pule para a próxima ou abandone-a.",
	ABANDON_SUITE: "Se precisar desistir de toda a etapa, use este botão.",
	FLOATING_PILL:
		"Toque fora do cartão a qualquer momento para minimizá-lo assim. Toque no indicador para reabrir, ou arraste-o para outro lugar da tela enquanto faz a tarefa.",
};

export interface BuildSurveyTourStepsDeps {
	setExpanded: (value: boolean) => void;
	scrollChecklistTo: (mode: "top" | "current") => Promise<void>;
}

export function buildSurveyTourSteps(
	deps: BuildSurveyTourStepsDeps,
	allTasksResolved: boolean,
): TourStep[] {
	const stepIndex = getSurveyTourStepIndex(allTasksResolved);
	const orderedKeys = (Object.keys(stepIndex) as (keyof SurveyTourStepIndex)[])
		.filter(key => stepIndex[key] !== undefined)
		.sort((a, b) => (stepIndex[a] as number) - (stepIndex[b] as number));
	const stepCount = orderedKeys.length;

	const buildStep = (key: keyof SurveyTourStepIndex): TourStep => ({
		render: ({ next, stop, isLast }) =>
			createElement(SurveyTourTooltip, {
				text: TOUR_STEP_TEXT[key],
				stepIndex: stepIndex[key] as number,
				stepCount,
				isLast,
				onNext: next,
				onSkip: stop,
			}),
	});

	return orderedKeys.map(key => {
		if (key === "FLOATING_PILL") {
			return {
				...buildStep(key),
				before: () => {
					deps.setExpanded(false);
					return new Promise<void>(resolve => setTimeout(resolve, 50));
				},
			};
		}
		if (key === "CHECKLIST") {
			return {
				...buildStep(key),
				before: () => deps.scrollChecklistTo("top"),
			};
		}
		if (key === "SKIP_OR_ABANDON_TASK") {
			return {
				...buildStep(key),
				before: () => deps.scrollChecklistTo("current"),
			};
		}
		return buildStep(key);
	});
}
