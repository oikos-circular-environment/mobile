import { eq } from "drizzle-orm";
import * as Crypto from "expo-crypto";
import { usePathname } from "expo-router";
import { useEffect, useRef } from "react";
import { useSurveyProtocol } from "@/components/survey/hooks/use-survey-protocol";
import { getSurveyDb } from "@/libs/survey/db/client";
import { surveyTaskRun } from "@/libs/survey/db/schema";
import { createTaskSignalWatcher } from "@/libs/survey/signal-matcher";
import { useSurveyExecutionStore } from "@/stores/survey-execution-store";

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

		if (!currentTaskCode || !protocol || !suiteRunId) return;

		const taskDefinition = protocol.tasks.find(t => t.code === currentTaskCode);
		if (!taskDefinition) return;

		const taskRunId = Crypto.randomUUID();
		const startedAt = new Date().toISOString();
		const db = getSurveyDb();
		db.insert(surveyTaskRun)
			.values({
				id: taskRunId,
				suiteRunId,
				taskCode: currentTaskCode,
				position: currentTaskIndex,
				startedAt,
			})
			.catch(() => {
				// Modo de falha aceito: perde só o registro local desta tarefa.
			});

		watcherRef.current = createTaskSignalWatcher(taskDefinition.success, () => {
			db.update(surveyTaskRun)
				.set({
					finishedAt: new Date().toISOString(),
					outcome: "YES",
					autoDetected: true,
				})
				.where(eq(surveyTaskRun.id, taskRunId))
				.catch(() => {});
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
