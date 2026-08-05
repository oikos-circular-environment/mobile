import { useQuery } from "@tanstack/react-query";
import { listIbgeMunicipios, listIbgeUfs } from "@/libs/brasil-api-sdk";

/** Estados e municípios do catálogo já usado pelo restante do app — nunca digitados. */
export function useSurveyStates() {
	return useQuery({
		queryKey: ["survey", "catalog", "states"],
		queryFn: async () => {
			const res = await listIbgeUfs();
			return (res.data ?? []).sort((a, b) => a.nome.localeCompare(b.nome));
		},
		staleTime: Number.POSITIVE_INFINITY,
	});
}

export function useSurveyCities(stateCode: string | null) {
	return useQuery({
		queryKey: ["survey", "catalog", "cities", stateCode],
		queryFn: async () => {
			const res = await listIbgeMunicipios({
				path: { siglaUF: stateCode ?? "" },
			});
			return (res.data ?? []).sort((a, b) => a.nome.localeCompare(b.nome));
		},
		enabled: Boolean(stateCode),
		staleTime: Number.POSITIVE_INFINITY,
	});
}
