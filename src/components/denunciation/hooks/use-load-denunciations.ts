import { getV1Denunciations } from "@oikos-circular-environment/oikos-sdk";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useDenunciationStore } from "@/stores/denunciation-store";

export function useLoadDenunciations() {
	const setDenunciations = useDenunciationStore(s => s.setDenunciations);

	const query = useQuery({
		queryKey: ["denunciations"],
		queryFn: async () => {
			const res = await getV1Denunciations();
			return res.data;
		},
	});

	useEffect(() => {
		if (query.data?.denunciations) {
			setDenunciations(query.data.denunciations);
		}
	}, [query.data, setDenunciations]);

	return query;
}
