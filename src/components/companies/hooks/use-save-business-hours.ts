import { useMutation } from "@tanstack/react-query";
import { toast } from "@/components/toast";
import { useCompaniesStore } from "@/stores/companies-store";
import type { PutV1CompaniesByIdBusinessHoursData } from "@/libs/oikos-sdk";
import { putV1CompaniesByIdBusinessHours } from "@/libs/oikos-sdk";

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
			toast.success("Horários salvos com sucesso!");
		},
		onError: () => {
			toast.error("Erro ao salvar horários", "Tente novamente.");
		},
	});
}
