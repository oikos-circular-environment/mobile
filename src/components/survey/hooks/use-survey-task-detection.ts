import { eq } from "drizzle-orm";
import { usePathname } from "expo-router";
import { useEffect, useRef } from "react";
import { useSurveyProtocol } from "@/components/survey/hooks/use-survey-protocol";
import { getSurveyDb } from "@/libs/survey/db/client";
import { surveyTaskRun } from "@/libs/survey/db/schema";
import { createTaskSignalWatcher } from "@/libs/survey/signal-matcher";
import { getOrCreateOpenTaskRun } from "@/libs/survey/task-run";
import {
	selectCurrentTaskActiveMs,
	useSurveyExecutionStore,
} from "@/stores/survey-execution-store";

/**
 * Liga o casador de sinais (M06) à tarefa atual: cria um observador para a regra de
 * sucesso da tarefa em execução, grava `survey_task_run` ao iniciar e ao concluir, e
 * avança a tarefa automaticamente quando o sinal casa — sem diálogo de confirmação.
 */
export function useSurveyTaskDetection() {
	const { data: protocol } = useSurveyProtocol();
	const isActive = useSurveyExecutionStore(s => s.isActive);
	const suiteRunId = useSurveyExecutionStore(s => s.suiteRunId);
	const tasks = useSurveyExecutionStore(s => s.tasks);
	const currentTaskIndex = useSurveyExecutionStore(s => s.currentTaskIndex);
	const completeCurrentTask = useSurveyExecutionStore(
		s => s.completeCurrentTask,
	);
	const pathname = usePathname();

	const currentTask = tasks[currentTaskIndex];
	const currentTaskCode = isActive ? currentTask?.code : undefined;

	const watcherRef = useRef<ReturnType<typeof createTaskSignalWatcher> | null>(
		null,
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: recriar o observador só quando a tarefa muda, não a cada render do protocolo
	useEffect(() => {
		watcherRef.current?.dispose();
		watcherRef.current = null;

		if (!currentTaskCode || !protocol || !suiteRunId || !currentTask) return;

		const taskDefinition = protocol.tasks.find(t => t.code === currentTaskCode);
		if (!taskDefinition) return;

		// Disparada em paralelo à criação do observador — nunca bloqueia a detecção.
		// Modo de falha aceito: se a gravação local falhar, a tarefa ainda avança; só o
		// registro do outcome no SQLite é que se perde.
		const taskRunPromise = getOrCreateOpenTaskRun(
			suiteRunId,
			currentTaskCode,
			currentTask.position,
		).catch(() => null);

		watcherRef.current = createTaskSignalWatcher(taskDefinition.success, () => {
			const activeMsDelta = selectCurrentTaskActiveMs(
				useSurveyExecutionStore.getState(),
			);
			taskRunPromise.then(taskRun => {
				if (!taskRun) return;
				getSurveyDb()
					.update(surveyTaskRun)
					.set({
						finishedAt: new Date().toISOString(),
						activeMs: taskRun.activeMs + activeMsDelta,
						outcome: "YES",
						autoDetected: true,
					})
					.where(eq(surveyTaskRun.id, taskRun.id))
					.catch(() => {});
			});
			completeCurrentTask();
		});

		return () => {
			watcherRef.current?.dispose();
			watcherRef.current = null;
		};
	}, [currentTaskCode, suiteRunId]);

	useEffect(() => {
		watcherRef.current?.notifyScreen(pathname);
	}, [pathname]);
}
