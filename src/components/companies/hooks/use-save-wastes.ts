import { useMutation } from "@tanstack/react-query";
import { toast } from "@/components/toast";
import { logCompanyEvent } from "@/libs/observe-events";
import type { PutV1CompaniesByIdWastesData } from "@/libs/oikos-sdk";
import { putV1CompaniesByIdWastes } from "@/libs/oikos-sdk";
import { useCompaniesStore } from "@/stores/companies-store";

type SaveWastesBody = PutV1CompaniesByIdWastesData["body"];

export function useSaveWastes(companyId: string) {
	const updateWastes = useCompaniesStore(s => s.updateWastes);

	return useMutation({
		mutationFn: (body: SaveWastesBody) =>
			putV1CompaniesByIdWastes({ path: { id: companyId }, body }),
		onSuccess: data => {
			if (data.data?.wastes) {
				updateWastes(companyId, data.data.wastes);
			}
			logCompanyEvent("company.waste_saved", { success: true, companyId });
			toast.success("Resíduos salvos com sucesso!");
		},
		onError: () => {
			logCompanyEvent("company.waste_saved", { success: false, companyId });
			toast.error("Erro ao salvar resíduos", "Tente novamente.");
		},
	});
}
