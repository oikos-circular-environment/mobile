import { eq } from "drizzle-orm";
import { getSurveyDb } from "@/libs/survey/db/client";
import {
	surveyAnswer,
	surveySuiteRun,
	surveyTaskRun,
} from "@/libs/survey/db/schema";

type Outcome = "YES" | "NO" | "PARTIAL";

export type CheckpointPayload = {
	session_id: string;
	suite: {
		code: string;
		position: number;
		started_at: string;
		active_ms: number;
		wall_ms: number;
		finished_at?: string;
		outcome?: Outcome;
	};
	tasks: {
		code: string;
		position: number;
		started_at: string;
		finished_at?: string;
		active_ms: number;
		outcome?: Outcome;
		auto_detected: boolean;
	}[];
	answers: {
		question_key: string;
		value_text?: string;
		value_number?: number;
	}[];
};

export async function buildCheckpoint(
	sessionId: string,
	suiteRunId: string,
	isClosing: boolean,
): Promise<CheckpointPayload> {
	const db = getSurveyDb();
	const now = new Date().toISOString();

	const suiteRun = await db
		.select()
		.from(surveySuiteRun)
		.where(eq(surveySuiteRun.id, suiteRunId))
		.then(rows => rows[0]);

	if (!suiteRun) {
		throw new Error(`Suite run ${suiteRunId} not found`);
	}

	const startedAt = suiteRun.startedAt;
	const wallMs = Math.max(
		0,
		new Date(now).getTime() - new Date(startedAt).getTime(),
	);

	const taskRuns = await db
		.select()
		.from(surveyTaskRun)
		.where(eq(surveyTaskRun.suiteRunId, suiteRunId));

	const answers = await db
		.select()
		.from(surveyAnswer)
		.where(eq(surveyAnswer.suiteRunId, suiteRunId));

	const suite: CheckpointPayload["suite"] = {
		code: suiteRun.suiteCode,
		position: suiteRun.position,
		started_at: startedAt,
		active_ms: suiteRun.activeMs,
		wall_ms: wallMs,
	};

	if (isClosing) {
		suite.finished_at = now;
		suite.outcome = (suiteRun.outcome as Outcome) ?? undefined;
	}

	return {
		session_id: sessionId,
		suite,
		tasks: taskRuns.map(run => ({
			code: run.taskCode,
			position: run.position,
			started_at: run.startedAt,
			finished_at: run.finishedAt ?? undefined,
			active_ms: run.activeMs ?? 0,
			outcome: (run.outcome as Outcome | null) ?? undefined,
			auto_detected: run.autoDetected,
		})),
		answers: answers.map(answer => ({
			question_key: answer.questionKey,
			value_text: answer.valueText ?? undefined,
			value_number: answer.valueNumber ?? undefined,
		})),
	};
}
