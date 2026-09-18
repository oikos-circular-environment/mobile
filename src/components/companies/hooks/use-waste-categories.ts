import { getV1WasteCategories } from "@oikos-circular-environment/oikos-sdk";
import { useQuery } from "@tanstack/react-query";

export function useWasteCategories() {
	const query = useQuery({
		queryKey: ["waste-categories"],
		queryFn: async () => {
			const res = await getV1WasteCategories();
			return res.data;
		},
	});

	return {
		...query,
		categories: query.data?.categories ?? [],
	};
}
