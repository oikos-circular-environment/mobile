import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	getCepV2,
	listIbgeMunicipios,
	listIbgeUfs,
	type Municipio,
	type State,
} from "@/libs/brasil-api-sdk";
import { mask } from "@/libs/mask";

const DAY_MS = 1000 * 60 * 60 * 24;

export type ResolvedCepValues = {
	zip_code: string;
	street: string;
	district: string;
	city: string;
	state: string;
	state_code: string;
	state_ibge_id: number;
	city_ibge_id: number;
};

export async function resolveCepToAddress(
	cep: string,
	cachedStates: State[] | undefined,
): Promise<{
	values: ResolvedCepValues;
	cities: Municipio[];
	stateCode: string;
}> {
	// CEP e estados (quando não há cache) rodam em paralelo
	const [cepRes, statesList] = await Promise.all([
		getCepV2({ path: { cep } }),
		cachedStates
			? Promise.resolve(cachedStates)
			: listIbgeUfs().then(r =>
					(r.data ?? []).sort((a, b) => a.nome.localeCompare(b.nome)),
				),
	]);

	if (!cepRes.data) throw new Error("CEP não encontrado");

	// Cidades dependem da sigla retornada pelo CEP — fetch em série
	const citiesRes = await listIbgeMunicipios({
		path: { siglaUF: cepRes.data.state },
	});
	const cities = (citiesRes.data ?? []).sort((a, b) =>
		a.nome.localeCompare(b.nome),
	);

	const uf = statesList.find(s => s.sigla === cepRes.data?.state);
	const city = cities.find(
		c => c.nome.toUpperCase() === cepRes.data?.city.toUpperCase(),
	);

	return {
		values: {
			zip_code: mask.cep(cepRes.data.cep),
			street: cepRes.data.street ?? "",
			district: cepRes.data.neighborhood ?? "",
			city: cepRes.data.city,
			state: uf?.nome ?? "",
			state_code: cepRes.data.state,
			state_ibge_id: uf?.id ?? 0,
			city_ibge_id: city ? Number(city.codigo_ibge) : 0,
		},
		cities,
		stateCode: cepRes.data.state,
	};
}

export function useCompanyAddress(selectedStateCode: string) {
	const queryClient = useQueryClient();

	const { data: states, isPending: isPendingStates } = useQuery({
		queryKey: ["states"],
		queryFn: async () => {
			const res = await listIbgeUfs();
			return (res.data ?? []).sort((a, b) => a.nome.localeCompare(b.nome));
		},
		staleTime: DAY_MS,
	});

	const { data: cities, isPending: isPendingCities } = useQuery({
		queryKey: ["cities", selectedStateCode],
		queryFn: async () => {
			const res = await listIbgeMunicipios({
				path: { siglaUF: selectedStateCode },
			});
			return (res.data ?? []).sort((a, b) => a.nome.localeCompare(b.nome));
		},
		enabled: selectedStateCode.length === 2,
	});

	const cepMutation = useMutation({
		mutationFn: (cep: string) =>
			resolveCepToAddress(cep, queryClient.getQueryData<State[]>(["states"])),
	});

	const searchCep = async (cep: string): Promise<ResolvedCepValues> => {
		const result = await cepMutation.mutateAsync(cep);
		// Pré-popula o cache para que o useQuery de cidades não dispare nova requisição
		queryClient.setQueryData(["cities", result.stateCode], result.cities);
		return result.values;
	};

	return {
		states,
		cities,
		isPendingStates,
		isPendingCities,
		isResolvingCep: cepMutation.isPending,
		searchCep,
	};
}
