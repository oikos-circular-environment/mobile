import { eq } from "drizzle-orm";
import {
	type ExecutionTask,
	useSurveyExecutionStore,
} from "@/stores/survey-execution-store";
import { getSurveyDb } from "./db/client";
import { surveySuiteRun, surveyTaskRun } from "./db/schema";

export interface ProtocolForRestore {
	key: string;
	suites: Array<{
		code: string;
		title: string;
		objective: string;
		task_codes: string[];
	}>;
	tasks: Array<{
		code: string;
		title: string;
		instruction: string;
	}>;
}

export interface PersonaForRestore {
	key: string;
	suites: Array<{
		suite_code: string;
		specific_objectives: string[];
	}>;
}

export interface RestoreExecutionInput {
	sessionId: string;
	persona: string;
	protocol: ProtocolForRestore;
	personaDefinition: PersonaForRestore;
}

function taskStatusFromDb(
	finishedAt: string | null,
	outcome: string | null,
): ExecutionTask["status"] {
	if (!finishedAt) return "pending";
	if (outcome === "NO") return "abandoned";
	return "done";
}

export async function restoreSurveyExecution(input: RestoreExecutionInput) {
	console.log("[survey] restoreSurveyExecution iniciado", {
		sessionId: input.sessionId,
		persona: input.persona,
		protocolKey: input.protocol.key,
	});

	const db = getSurveyDb();

	const suiteRuns = await db
		.select()
		.from(surveySuiteRun)
		.where(eq(surveySuiteRun.sessionId, input.sessionId))
		.orderBy(surveySuiteRun.position);

	console.log("[survey] suiteRuns encontradas:", suiteRuns.length);

	const personaSuiteCodes = input.personaDefinition.suites.map(
		s => s.suite_code,
	);

	// Garante que o roteiro da persona esteja no store.
	useSurveyExecutionStore.setState({ suiteQueue: personaSuiteCodes });

	const currentSuiteRun =
		suiteRuns.find(run => !run.finishedAt) ?? suiteRuns[suiteRuns.length - 1];

	if (!currentSuiteRun) {
		console.log("[survey] nenhuma suiteRun para restaurar");
		return;
	}

	console.log("[survey] suiteRun atual:", {
		code: currentSuiteRun.suiteCode,
		finishedAt: currentSuiteRun.finishedAt,
	});

	const currentSuiteIndex = personaSuiteCodes.indexOf(
		currentSuiteRun.suiteCode,
	);
	if (currentSuiteIndex === -1) {
		console.log("[survey] suiteCode não encontrado no roteiro da persona");
		return;
	}

	// Se a suíte atual já está finalizada, o índice deve apontar para depois dela,
	// indicando que todas as suítes foram concluídas.
	const suiteIndex = currentSuiteRun.finishedAt
		? currentSuiteIndex + 1
		: currentSuiteIndex;

	const suite = input.protocol.suites.find(
		s => s.code === currentSuiteRun.suiteCode,
	);
	if (!suite) {
		console.log("[survey] suite não encontrada no protocolo");
		return;
	}

	const personaSuite = input.personaDefinition.suites.find(
		s => s.suite_code === currentSuiteRun.suiteCode,
	);

	const taskRuns = await db
		.select()
		.from(surveyTaskRun)
		.where(eq(surveyTaskRun.suiteRunId, currentSuiteRun.id))
		.orderBy(surveyTaskRun.position);

	const tasks: ExecutionTask[] = suite.task_codes.map((taskCode, index) => {
		const taskDef = input.protocol.tasks.find(t => t.code === taskCode);
		const dbRun = taskRuns.find(run => run.taskCode === taskCode);

		return {
			code: taskCode,
			title: taskDef?.title ?? taskCode,
			instruction: taskDef?.instruction ?? "",
			position: index,
			status: dbRun
				? taskStatusFromDb(dbRun.finishedAt, dbRun.outcome)
				: "pending",
			outcome: dbRun?.outcome === "YES" ? "YES" : undefined,
		};
	});

	const currentTaskIndex = tasks.findIndex(t => t.status === "pending");
	const normalizedTasks =
		currentTaskIndex === -1
			? tasks
			: tasks.map((t, i) =>
					i === currentTaskIndex ? { ...t, status: "current" as const } : t,
				);

	const restoredState = {
		suiteQueue: personaSuiteCodes,
		suiteIndex,
		suiteCode: suite.code,
		suiteTitle: suite.title,
		suiteObjective: suite.objective,
		suiteSpecificObjectives: personaSuite?.specific_objectives ?? [],
		tasks: normalizedTasks,
		currentTaskIndex: currentTaskIndex === -1 ? tasks.length : currentTaskIndex,
		suiteRunId: currentSuiteRun.id,
		isActive: !currentSuiteRun.finishedAt,
		isExpanded: !currentSuiteRun.finishedAt,
		isPaused: false,
		suiteActiveMs: currentSuiteRun.activeMs,
		currentTaskStartActiveMs: 0,
		suiteOutcomeOverride: null,
	};

	console.log("[survey] execution store restaurado:", {
		suiteCode: restoredState.suiteCode,
		suiteIndex: restoredState.suiteIndex,
		isActive: restoredState.isActive,
		tasksCount: restoredState.tasks.length,
		currentTaskIndex: restoredState.currentTaskIndex,
	});

	useSurveyExecutionStore.setState(restoredState);
}
