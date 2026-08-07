import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import surveyMigrations from "./migrations/migrations";
import * as schema from "./schema";

const DATABASE_NAME = "survey.db";

let db: ReturnType<typeof drizzle<typeof schema>> | undefined;

/** Instância única do banco do modo pesquisa, aberta sob demanda. */
export function getSurveyDb() {
	if (!db) {
		const sqlite = openDatabaseSync(DATABASE_NAME);
		console.log("[survey] database path:", sqlite.databasePath);
		sqlite.execSync("PRAGMA foreign_keys = ON;");
		db = drizzle(sqlite, { schema });
	}
	return db;
}

export { surveyMigrations };
