import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
	getCepV2,
	listIbgeMunicipios,
	listIbgeUfs,
	type Municipio,
	type State,
} from "@/libs/brasil-api-sdk";
import { mask } from "@/libs/mask";

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

export function useCompanyAddress(selectedStateCode: string) {
	const [states, setStates] = useState<State[]>();
	const [cities, setCities] = useState<Municipio[]>();

	const { mutate: loadStates, isPending: isPendingStates } = useMutation({
		mutationFn: async () => {
			const res = await listIbgeUfs();
			return (res.data ?? []).sort((a, b) => a.nome.localeCompare(b.nome));
		},
		onSuccess: setStates,
	});

	useEffect(() => {
		loadStates();
	}, [loadStates]);

	const { mutate: loadCities, isPending: isPendingCities } = useMutation({
		mutationFn: async (stateCode: string) => {
			const res = await listIbgeMunicipios({ path: { siglaUF: stateCode } });
			return (res.data ?? []).sort((a, b) => a.nome.localeCompare(b.nome));
		},
		onSuccess: setCities,
	});

	useEffect(() => {
		if (selectedStateCode.length === 2) loadCities(selectedStateCode);
	}, [selectedStateCode, loadCities]);

	const { mutateAsync: resolveCep, isPending: isResolvingCep } = useMutation({
		mutationFn: async (cep: string) => {
			const cepRes = await getCepV2({ path: { cep } });

			if (!cepRes.data) throw new Error("CEP não encontrado");

			const citiesRes = await listIbgeMunicipios({
				path: { siglaUF: cepRes.data.state },
			});
			const resolvedCities = (citiesRes.data ?? []).sort((a, b) =>
				a.nome.localeCompare(b.nome),
			);

			const { state: sigla, city: cityName } = cepRes.data;
			const uf = states?.find(s => s.sigla === sigla);
			const city = resolvedCities.find(
				c => c.nome.toUpperCase() === cityName.toUpperCase(),
			);

			return {
				cities: resolvedCities,
				values: {
					zip_code: mask.cep(cepRes.data.cep),
					street: cepRes.data.street ?? "",
					district: cepRes.data.neighborhood ?? "",
					city: cityName,
					state: uf?.nome ?? "",
					state_code: sigla,
					state_ibge_id: uf?.id ?? 0,
					city_ibge_id: city ? Number(city.codigo_ibge) : 0,
				} satisfies ResolvedCepValues,
			};
		},
		onSuccess: ({ cities: resolvedCities }) => setCities(resolvedCities),
	});

	const searchCep = async (cep: string): Promise<ResolvedCepValues> => {
		const result = await resolveCep(cep);
		return result.values;
	};

	return {
		states,
		cities,
		isPendingStates,
		isPendingCities,
		isResolvingCep,
		searchCep,
	};
}
