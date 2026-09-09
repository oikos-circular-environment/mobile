import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import oikosAppMigrations from "./migrations/migrations";
import * as schema from "./schema";

const DATABASE_NAME = "oikos-app.db";

let db: ReturnType<typeof drizzle<typeof schema>> | undefined;

/** Instância única do banco local da aplicação (não relacionado ao survey), aberta sob demanda. */
export function getOikosAppDb() {
	if (!db) {
		const sqlite = openDatabaseSync(DATABASE_NAME);
		db = drizzle(sqlite, { schema });
	}
	return db;
}

export { oikosAppMigrations };
