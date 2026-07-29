import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";

/**
 * Banco de teste — SQLite real em memória via `better-sqlite3`, nunca `expo-sqlite` (módulo
 * nativo, não roda sob Jest). Mesmo schema e mesmas migrações do runtime: só o driver muda.
 */
export function createTestSurveyDb() {
	const sqlite = new Database(":memory:");
	sqlite.pragma("foreign_keys = ON");
	const db = drizzle(sqlite, { schema });
	migrate(db, { migrationsFolder: `${__dirname}/migrations` });
	return db;
}

export type TestSurveyDb = ReturnType<typeof createTestSurveyDb>;
