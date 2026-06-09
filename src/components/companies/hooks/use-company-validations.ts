import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect } from "react";
import { getV1CompaniesByIdValidations } from "@/libs/oikos-sdk";
import { useCompaniesStore } from "@/stores/companies-store";

export function useCompanyValidations(companyId: string) {
	const queryClient = useQueryClient();
	const updateCompany = useCompaniesStore(s => s.updateCompany);

	useFocusEffect(
		useCallback(() => {
			queryClient.invalidateQueries({
				queryKey: ["companies", companyId, "validations"],
			});
		}, [queryClient, companyId]),
	);

	const query = useQuery({
		queryKey: ["companies", companyId, "validations"],
		queryFn: async () => {
			const res = await getV1CompaniesByIdValidations({
				path: { id: companyId },
			});
			return res.data?.validation;
		},
		enabled: !!companyId,
	});

	const { data: validation } = query;

	useEffect(() => {
		if (validation) {
			const isCompanyValid =
				validation.general_registration &&
				validation.address &&
				validation.business_hours &&
				validation.services &&
				validation.wastes;

			updateCompany(companyId, { is_company_valid: isCompanyValid });
		}
	}, [validation, companyId, updateCompany]);

	return query;
}
