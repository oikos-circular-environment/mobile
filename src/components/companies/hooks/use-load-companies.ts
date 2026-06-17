import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { getV1Companies } from "@/libs/oikos-sdk";
import { useCompaniesStore } from "@/stores/companies-store";

export function useLoadCompanies() {
	const setCompanies = useCompaniesStore(s => s.setCompanies);

	const query = useQuery({
		queryKey: ["companies"],
		queryFn: async () => {
			const res = await getV1Companies();
			return res.data;
		},
	});

	useEffect(() => {
		if (query.data?.companies) {
			setCompanies(query.data.companies);
		}
	}, [query.data, setCompanies]);

	return query;
}
