import { useMutation } from "@tanstack/react-query";
import { toast } from "@/components/toast";
import type { PutV1CompaniesByIdAddressesData } from "@/libs/oikos-sdk";
import { putV1CompaniesByIdAddresses } from "@/libs/oikos-sdk";
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
			toast.success("Endereço salvo com sucesso!");
		},
		onError: () => {
			toast.error("Erro ao salvar endereço", "Tente novamente.");
		},
	});
}
