import { useQuery } from "@tanstack/react-query";
import { eq } from "drizzle-orm";
import { useEffect } from "react";
import { getSurveyDb } from "@/libs/survey/db/client";
import { surveySession } from "@/libs/survey/db/schema";
import { subscribeParticipantSync } from "@/libs/survey/survey-participant-sync-bus";

/**
 * Lê o participant_code da sessão local — só existe depois que E2 (ou E4) sincroniza
 * com o servidor, então continua tentando de tempos em tempos até aparecer.
 */
export function useSurveyParticipantCode(sessionId: string | null) {
	const query = useQuery({
		queryKey: ["survey", "participant-code", sessionId],
		queryFn: async () => {
			if (!sessionId) return null;
			const rows = await getSurveyDb()
				.select()
				.from(surveySession)
				.where(eq(surveySession.id, sessionId));
			return rows[0]?.participantCode ?? null;
		},
		enabled: Boolean(sessionId),
		refetchInterval: query => (query.state.data ? false : 750),
	});

	const { refetch } = query;
	useEffect(() => {
		if (!sessionId) return;
		return subscribeParticipantSync(syncedSessionId => {
			if (syncedSessionId === sessionId) {
				refetch();
			}
		});
	}, [sessionId, refetch]);

	return query.data ?? null;
}
