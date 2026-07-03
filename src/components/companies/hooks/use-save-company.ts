import { useMutation } from "@tanstack/react-query";
import { toast } from "@/components/toast";
import type { PutV1CompaniesByIdData } from "@/libs/oikos-sdk";
import { putV1CompaniesById } from "@/libs/oikos-sdk";
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
			toast.success("Empresa salva com sucesso!");
		},
		onError: () => {
			toast.error("Erro ao salvar empresa", "Tente novamente.");
		},
	});
}
