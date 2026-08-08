import { useQuery } from "@tanstack/react-query";
import { surveyClient } from "@/libs/survey/api/client";
import {
	getCachedProtocol,
	setCachedProtocol,
} from "@/libs/survey/protocol-cache";

/**
 * E1 — protocolo vigente. `staleTime: Infinity` porque a sessão nunca troca de
 * versão no meio: uma vez baixado, o protocolo fica em cache pelo resto da participação.
 *
 * O protocolo também é cacheado no SQLite para que, após um refresh do app ou
 * offline, o card de convite e o resume ainda consigam montar as etapas.
 */
export function useSurveyProtocol() {
	return useQuery({
		queryKey: ["survey", "protocol"],
		queryFn: async () => {
			const remote = await surveyClient.usability.protocol.query();
			if (remote) {
				await setCachedProtocol(remote.key, remote.version, remote);
				return remote;
			}

			const cached = await getCachedProtocol("oikos-walkthrough");
			if (cached) {
				return cached.payload as Awaited<
					ReturnType<typeof surveyClient.usability.protocol.query>
				>;
			}

			return null;
		},
		staleTime: Number.POSITIVE_INFINITY,
	});
}
