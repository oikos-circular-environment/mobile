import { useMutation } from "@tanstack/react-query";
import { toast } from "@/components/toast";
import { logCompanyEvent } from "@/libs/observe-events";
import type { PutV1CompaniesByIdServicesData } from "@/libs/oikos-sdk";
import { putV1CompaniesByIdServices } from "@/libs/oikos-sdk";
import { useCompaniesStore } from "@/stores/companies-store";

type SaveServicesBody = PutV1CompaniesByIdServicesData["body"];

export function useSaveServices(companyId: string) {
	const updateServices = useCompaniesStore(s => s.updateServices);

	return useMutation({
		mutationFn: (body: SaveServicesBody) =>
			putV1CompaniesByIdServices({ path: { id: companyId }, body }),
		onSuccess: data => {
			if (data.data?.services) {
				updateServices(companyId, data.data.services);
			}
			logCompanyEvent("company.service_saved", { success: true, companyId });
			toast.success("Serviços salvos com sucesso!");
		},
		onError: () => {
			logCompanyEvent("company.service_saved", { success: false, companyId });
			toast.error("Erro ao salvar serviços", "Tente novamente.");
		},
	});
}
