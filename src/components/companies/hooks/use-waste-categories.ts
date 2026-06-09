import { useQuery } from "@tanstack/react-query";
import {
	type GetV1WasteCategoriesResponses,
	getV1WasteCategories,
} from "@/libs/oikos-sdk";

export type WasteCategory =
	GetV1WasteCategoriesResponses[200]["categories"][number];

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
