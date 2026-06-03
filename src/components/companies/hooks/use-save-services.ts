import { useMutation } from "@tanstack/react-query";
import { toast } from "@/components/toast";
import { useCompaniesStore } from "@/stores/companies-store";
import type { PutV1CompaniesByIdServicesData } from "@/libs/oikos-sdk";
import { putV1CompaniesByIdServices } from "@/libs/oikos-sdk";

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
			toast.success("Serviços salvos com sucesso!");
		},
		onError: () => {
			toast.error("Erro ao salvar serviços", "Tente novamente.");
		},
	});
}
