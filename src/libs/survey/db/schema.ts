/**
 * Persistência local do modo pesquisa — banco isolado, exclusivo deste módulo. Nenhuma
 * tabela aqui referencia ou é referenciada por qualquer outra parte do app.
 *
 * As tabelas espelham o contrato dos endpoints E1-E5 (`plans/survey-usability-in-app/
 * 02-tech-plan.md`), não o schema MySQL do serviço `survey` — o aparelho só guarda o que
 * ele mesmo gera e envia, nunca o protocolo inteiro normalizado.
 *
 * Datas são texto ISO-8601 em UTC: SQLite não tem tipo `timestamp` nativo, e texto ISO
 * ordena e compara corretamente sem conversão.
 */

import {
	index,
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";

/** Cabeçalho da participação — espelha o corpo/resposta de E2. Uma linha por sessão. */
export const surveySession = sqliteTable("survey_session", {
	id: text("id").primaryKey(), // uuid gerado no aparelho (Crypto.randomUUID())
	protocolKey: text("protocol_key").notNull(),
	protocolVersion: integer("protocol_version").notNull(),
	persona: text("persona").notNull(),
	participantCode: text("participant_code"), // nulo até E2 responder

	stateUf: text("state_uf").notNull(),
	cityName: text("city_name").notNull(),
	ageRange: text("age_range").notNull(),
	educationLevel: text("education_level").notNull(),
	chainRole: text("chain_role").notNull(),
	wasteContactFrequency: integer("waste_contact_frequency").notNull(),
	appExperience: integer("app_experience").notNull(),

	consentVersion: text("consent_version").notNull(),
	consentAt: text("consent_at").notNull(),

	deviceOs: text("device_os").notNull(),
	deviceOsVersion: text("device_os_version").notNull(),
	appVersion: text("app_version").notNull(),
	screenSize: text("screen_size").notNull(),

	status: text("status").notNull().default("IN_PROGRESS"), // IN_PROGRESS|COMPLETED|ABANDONED
	startedAt: text("started_at").notNull(),
	finishedAt: text("finished_at"),
	activeMs: integer("active_ms").notNull().default(0),
	wallMs: integer("wall_ms").notNull().default(0),
	abandonReason: text("abandon_reason"),

	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
});

/**
 * Uma execução de suíte por sessão. `synced` marca se o bloco já foi aceito pelo servidor
 * (E3) — antes disso a fila ainda tem o que enviar para esta suíte.
 */
export const surveySuiteRun = sqliteTable(
	"survey_suite_run",
	{
		id: text("id").primaryKey(),
		sessionId: text("session_id")
			.notNull()
			.references(() => surveySession.id, { onDelete: "cascade" }),
		suiteCode: text("suite_code").notNull(),
		position: integer("position").notNull(),
		startedAt: text("started_at").notNull(),
		finishedAt: text("finished_at"),
		activeMs: integer("active_ms").notNull().default(0),
		wallMs: integer("wall_ms").notNull().default(0),
		outcome: text("outcome"), // YES|PARTIAL|NO
		synced: integer("synced", { mode: "boolean" }).notNull().default(false),
	},
	t => [
		uniqueIndex("survey_suite_run_session_suite").on(t.sessionId, t.suiteCode),
	],
);

export const surveyTaskRun = sqliteTable(
	"survey_task_run",
	{
		id: text("id").primaryKey(),
		suiteRunId: text("suite_run_id")
			.notNull()
			.references(() => surveySuiteRun.id, { onDelete: "cascade" }),
		taskCode: text("task_code").notNull(),
		position: integer("position").notNull(),
		startedAt: text("started_at").notNull(),
		finishedAt: text("finished_at"),
		activeMs: integer("active_ms").notNull().default(0),
		outcome: text("outcome"),
		autoDetected: integer("auto_detected", { mode: "boolean" })
			.notNull()
			.default(false),
	},
	t => [uniqueIndex("survey_task_run_suite_task").on(t.suiteRunId, t.taskCode)],
);

/**
 * Log de eventos somente-adição. `id` é o `client_event_id` — mesma chave usada pelo
 * servidor pra idempotência (E3). `seq` é a ordem local: o relógio do aparelho não é
 * confiável (R8), então a ordenação vem da sequência, não do timestamp.
 */
export const surveyEvent = sqliteTable(
	"survey_event",
	{
		id: text("id").primaryKey(),
		sessionId: text("session_id")
			.notNull()
			.references(() => surveySession.id, { onDelete: "cascade" }),
		suiteRunId: text("suite_run_id").references(() => surveySuiteRun.id, {
			onDelete: "cascade",
		}),
		seq: integer("seq").notNull(),
		type: text("type").notNull(),
		taskCode: text("task_code"),
		occurredAt: text("occurred_at").notNull(),
		payload: text("payload", { mode: "json" }).notNull(),
	},
	t => [index("survey_event_session_seq").on(t.sessionId, t.seq)],
);

/**
 * Respostas de questionário, por suíte ou de fim de sessão (`suiteRunId` nulo). Chave e
 * valor, não coluna por pergunta — o conjunto de perguntas vem do protocolo baixado, não é
 * fixo no schema local.
 */
export const surveyAnswer = sqliteTable("survey_answer", {
	id: text("id").primaryKey(),
	sessionId: text("session_id")
		.notNull()
		.references(() => surveySession.id, { onDelete: "cascade" }),
	suiteRunId: text("suite_run_id").references(() => surveySuiteRun.id, {
		onDelete: "cascade",
	}),
	questionKey: text("question_key").notNull(),
	valueText: text("value_text"),
	valueNumber: integer("value_number"),
});
