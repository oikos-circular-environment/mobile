import { useMutation } from "@tanstack/react-query";
import { toast } from "@/components/toast";
import { patchV1CompaniesByIdStatus } from "@/libs/oikos-sdk";
import { useCompaniesStore } from "@/stores/companies-store";

export function useToggleCompanyStatus(companyId: string) {
	const updateCompany = useCompaniesStore(s => s.updateCompany);

	return useMutation({
		mutationFn: (status: boolean) =>
			patchV1CompaniesByIdStatus({ path: { id: companyId }, body: { status } }),
		onSuccess: data => {
			if (data.data?.company) {
				updateCompany(companyId, { status: data.data.company.status });
			}
		},
		onError: () => {
			toast.error("Erro ao alterar status", "Tente novamente.");
		},
	});
}
