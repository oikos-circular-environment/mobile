import { useQuery } from "@tanstack/react-query";
import { surveyClient } from "@/libs/survey/api/client";

/**
 * E1 — protocolo vigente. `staleTime: Infinity` porque a sessão nunca troca de
 * versão no meio: uma vez baixado, o protocolo fica em cache pelo resto da participação.
 */
export function useSurveyProtocol() {
	return useQuery({
		queryKey: ["survey", "protocol"],
		queryFn: () => surveyClient.usability.protocol.query(),
		staleTime: Number.POSITIVE_INFINITY,
	});
}
