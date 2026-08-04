import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { useEffect } from "react";
import { getSurveyDb, surveyMigrations } from "@/libs/survey/db/client";

/**
 * Roda as migrações do banco local do modo pesquisa uma vez, no boot do app —
 * sem bloquear a renderização do resto do app (survey é uma camada opcional).
 * Por ora a participação começa bem depois (onboarding, consentimento,
 * caracterização), tempo de sobra para a migração — que é síncrona e rápida —
 * terminar antes de qualquer INSERT real.
 */
export function SurveyMigrationsRunner() {
	const { success, error } = useMigrations(getSurveyDb(), surveyMigrations);

	useEffect(() => {
		if (error) {
			console.error("[survey] falha ao migrar o banco local", error);
		}
	}, [error]);

	useEffect(() => {
		if (success) {
			console.log("[survey] banco local migrado com sucesso");
		}
	}, [success]);

	return null;
}
