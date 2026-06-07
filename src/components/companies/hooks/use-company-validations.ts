import { useQuery } from "@tanstack/react-query";
import { getV1CompaniesByIdValidations } from "@/libs/oikos-sdk";

export function useCompanyValidations(companyId: string) {
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
