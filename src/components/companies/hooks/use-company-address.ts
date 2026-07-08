import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
	listIbgeMunicipios,
	listIbgeUfs,
	type Municipio,
	type State,
} from "@/libs/brasil-api-sdk";
import { useCepLookup } from "@/libs/use-cep-lookup";

export type ResolvedCepValues = {
	zip_code: string;
	street: string;
	district: string;
	city: string;
	state: string;
	state_code: string;
	state_ibge_id: number;
	city_ibge_id: number;
	latitude: number | null;
	longitude: number | null;
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

	const { lookupCep } = useCepLookup();

	const { mutateAsync: resolveCep, isPending: isResolvingCep } = useMutation({
		mutationFn: async (cep: string) => {
			const base = await lookupCep(cep);

			const citiesRes = await listIbgeMunicipios({
				path: { siglaUF: base.stateCode },
			});
			const resolvedCities = (citiesRes.data ?? []).sort((a, b) =>
				a.nome.localeCompare(b.nome),
			);

			const uf = states?.find(s => s.sigla === base.stateCode);
			const city = resolvedCities.find(
				c => c.nome.toUpperCase() === base.city.toUpperCase(),
			);

			return {
				cities: resolvedCities,
				values: {
					zip_code: base.cep,
					street: base.street,
					district: base.district,
					city: base.city,
					state: uf?.nome ?? "",
					state_code: base.stateCode,
					state_ibge_id: uf?.id ?? 0,
					city_ibge_id: city ? Number(city.codigo_ibge) : 0,
					latitude: base.latitude ? Number(base.latitude) : null,
					longitude: base.longitude ? Number(base.longitude) : null,
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
