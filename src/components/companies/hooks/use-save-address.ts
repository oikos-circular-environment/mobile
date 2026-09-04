import type { PutV1CompaniesByIdAddressesData } from "@oikos-circular-environment/oikos-sdk";
import { putV1CompaniesByIdAddresses } from "@oikos-circular-environment/oikos-sdk";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@/components/toast";
import { logCompanyEvent } from "@/libs/observe-events";
import { useCompaniesStore } from "@/stores/companies-store";

type SaveAddressBody = PutV1CompaniesByIdAddressesData["body"];

export function useSaveAddress(companyId: string) {
	const updateAddress = useCompaniesStore(s => s.updateAddress);

	return useMutation({
		mutationFn: (body: SaveAddressBody) =>
			putV1CompaniesByIdAddresses({ path: { id: companyId }, body }),
		onSuccess: data => {
			if (data.data?.address) {
				updateAddress(companyId, data.data.address);
			}
			logCompanyEvent("company.address_updated", {
				success: true,
				companyId,
			});
			toast.success("Endereço salvo com sucesso!");
		},
		onError: () => {
			logCompanyEvent("company.address_updated", {
				success: false,
				companyId,
			});
			toast.error("Erro ao salvar endereço", "Tente novamente.");
		},
	});
}
