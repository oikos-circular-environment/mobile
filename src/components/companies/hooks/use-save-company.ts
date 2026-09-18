import type { PutV1CompaniesByIdData } from "@oikos-circular-environment/oikos-sdk";
import { putV1CompaniesById } from "@oikos-circular-environment/oikos-sdk";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@/components/toast";
import { logCompanyEvent } from "@/libs/observe-events";
import { useCompaniesStore } from "@/stores/companies-store";

type SaveCompanyBody = PutV1CompaniesByIdData["body"];

export function useSaveCompany(companyId: string) {
	const updateCompany = useCompaniesStore(s => s.updateCompany);

	return useMutation({
		mutationFn: (body: SaveCompanyBody) =>
			putV1CompaniesById({ path: { id: companyId }, body }),
		onSuccess: data => {
			if (data.data?.company) {
				updateCompany(companyId, data.data.company);
			}
			logCompanyEvent("company.updated", { success: true, companyId });
			toast.success("Empresa salva com sucesso!");
		},
		onError: () => {
			logCompanyEvent("company.updated", { success: false, companyId });
			toast.error("Erro ao salvar empresa", "Tente novamente.");
		},
	});
}
