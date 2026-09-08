import type { PutV1CompaniesByIdBusinessHoursData } from "@oikos-circular-environment/oikos-sdk";
import { putV1CompaniesByIdBusinessHours } from "@oikos-circular-environment/oikos-sdk";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@/components/toast";
import { logCompanyEvent } from "@/libs/observe-events";
import { useCompaniesStore } from "@/stores/companies-store";

type SaveBusinessHoursBody = PutV1CompaniesByIdBusinessHoursData["body"];

export function useSaveBusinessHours(companyId: string) {
	const updateBusinessHours = useCompaniesStore(s => s.updateBusinessHours);

	return useMutation({
		mutationFn: (body: SaveBusinessHoursBody) =>
			putV1CompaniesByIdBusinessHours({ path: { id: companyId }, body }),
		onSuccess: data => {
			if (data.data?.business_hours) {
				updateBusinessHours(companyId, data.data.business_hours);
			}
			logCompanyEvent("company.hours_updated", { success: true, companyId });
			toast.success("Horários salvos com sucesso!");
		},
		onError: () => {
			logCompanyEvent("company.hours_updated", { success: false, companyId });
			toast.error("Erro ao salvar horários", "Tente novamente.");
		},
	});
}
