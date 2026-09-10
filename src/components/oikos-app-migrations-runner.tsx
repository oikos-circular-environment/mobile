import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { useEffect } from "react";
import { getOikosAppDb, oikosAppMigrations } from "@/libs/db/client";

/** Roda as migrações do banco local `oikos-app.db` uma vez, no boot do app. */
export function OikosAppMigrationsRunner() {
	const { error } = useMigrations(getOikosAppDb(), oikosAppMigrations);

	useEffect(() => {
		if (error) {
			console.error("[oikos-app-db] falha ao migrar o banco local", error);
		}
	}, [error]);

	return null;
}
