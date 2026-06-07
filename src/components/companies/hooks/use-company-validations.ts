import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { getV1CompaniesByIdValidations } from "@/libs/oikos-sdk";

export function useCompanyValidations(companyId: string) {
	const queryClient = useQueryClient();
	useFocusEffect(
		useCallback(() => {
			queryClient.invalidateQueries({
				queryKey: ["companies", companyId, "validations"],
			});
		}, [queryClient, companyId]),
	);

	return useQuery({
		queryKey: ["companies", companyId, "validations"],
		queryFn: async () => {
			const res = await getV1CompaniesByIdValidations({
				path: { id: companyId },
			});
			return res.data?.validation;
		},
		enabled: !!companyId,
	});
}
