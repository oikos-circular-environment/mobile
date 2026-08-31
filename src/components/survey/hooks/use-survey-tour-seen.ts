import { eq } from "drizzle-orm";
import { useCallback, useEffect, useState } from "react";
import { getSurveyDb } from "@/libs/survey/db/client";
import { surveySession } from "@/libs/survey/db/schema";

export interface UseSurveyTourSeenResult {
	loaded: boolean;
	seen: boolean;
	markSeen: () => void;
}

/**
 * `markSeen` marca o tour como visto no INÍCIO da execução (quando ele começa a
 * rodar), não na conclusão — proposital, para não precisar lidar com o estado de
 * "abandonou o tour no meio".
 *
 * O controle é persistido na coluna `tourSeenAt` de `surveySession`, chaveada por
 * `sessionId`. Cada participação de pesquisa cria uma sessão local nova — sem
 * isso, o tour nunca reapareceria após a primeira execução no device.
 * `sessionId` fica disponível assim que a sessão é criada localmente, sem
 * depender de round-trip com o servidor.
 */
export function useSurveyTourSeen(
	sessionId: string | null | undefined,
): UseSurveyTourSeenResult {
	const [loaded, setLoaded] = useState(false);
	const [seen, setSeen] = useState(false);

	useEffect(() => {
		if (!sessionId) {
			setSeen(false);
			setLoaded(true);
			return;
		}

		setLoaded(false);
		getSurveyDb()
			.select({ tourSeenAt: surveySession.tourSeenAt })
			.from(surveySession)
			.where(eq(surveySession.id, sessionId))
			.then(rows => {
				setSeen(Boolean(rows[0]?.tourSeenAt));
				setLoaded(true);
			});
	}, [sessionId]);

	const markSeen = useCallback(() => {
		if (!sessionId) return;

		setSeen(true);
		getSurveyDb()
			.update(surveySession)
			.set({ tourSeenAt: new Date().toISOString() })
			.where(eq(surveySession.id, sessionId))
			.catch(() => {});
	}, [sessionId]);

	return { loaded, seen, markSeen };
}
