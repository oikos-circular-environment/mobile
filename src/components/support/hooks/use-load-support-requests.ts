import { getV1Support } from "@oikos-circular-environment/oikos-sdk";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useSupportStore } from "@/stores/support-store";

export function useLoadSupportRequests() {
	const setSupports = useSupportStore(s => s.setSupports);

	const query = useQuery({
		queryKey: ["support"],
		queryFn: async () => {
			const res = await getV1Support();
			return res.data;
		},
	});

	useEffect(() => {
		if (query.data?.supports) {
			setSupports(query.data.supports);
		}
	}, [query.data, setSupports]);

	return query;
}
