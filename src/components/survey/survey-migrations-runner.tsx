import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { useEffect } from "react";
import { getSurveyDb, surveyMigrations } from "@/libs/survey/db/client";
import { restoreSurveySessionIfNeeded } from "@/libs/survey/restore-session";
import { useSurveyStore } from "@/stores/survey-store";

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
		if (!success) return;

		console.log("[survey] banco local migrado com sucesso");

		restoreSurveySessionIfNeeded().then(restored => {
			if (!restored) return;

			console.log("[survey] sessão ativa restaurada:", restored.sessionId);
			useSurveyStore.setState({
				sessionId: restored.sessionId,
				persona: restored.persona,
				participantCode: restored.participantCode,
				status: restored.status,
				currentSuiteCode: restored.currentSuiteCode,
				currentTaskCode: restored.currentTaskCode,
				activeMs: restored.activeMs,
				wallMs: restored.wallMs,
				consentVersion: restored.consentVersion,
				consentAt: restored.consentAt,
			});
		});
	}, [success]);

	return null;
}
