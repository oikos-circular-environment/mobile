import { useQuery } from "@tanstack/react-query";
import { getV1WasteCategories } from "@/libs/oikos-sdk";

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
