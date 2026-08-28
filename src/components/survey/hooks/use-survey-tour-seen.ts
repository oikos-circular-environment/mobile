import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY_PREFIX = "@oikos:survey-execution-tour-seen";

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
 * A chave é escopada por `participantCode` porque cada participação de pesquisa
 * cria uma conta sintética nova — sem isso, o tour nunca reapareceria após a
 * primeira execução no device.
 */
export function useSurveyTourSeen(
	participantCode: string | null | undefined,
): UseSurveyTourSeenResult {
	const [loaded, setLoaded] = useState(false);
	const [seen, setSeen] = useState(false);

	useEffect(() => {
		if (!participantCode) {
			setSeen(false);
			setLoaded(true);
			return;
		}

		setLoaded(false);
		AsyncStorage.getItem(`${STORAGE_KEY_PREFIX}:${participantCode}`).then(
			value => {
				setSeen(value === "1");
				setLoaded(true);
			},
		);
	}, [participantCode]);

	const markSeen = useCallback(() => {
		if (!participantCode) return;

		setSeen(true);
		AsyncStorage.setItem(`${STORAGE_KEY_PREFIX}:${participantCode}`, "1");
	}, [participantCode]);

	return { loaded, seen, markSeen };
}
