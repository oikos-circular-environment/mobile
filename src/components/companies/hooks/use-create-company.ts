import type { PostV1CompaniesData } from "@oikos-circular-environment/oikos-sdk";
import { postV1Companies } from "@oikos-circular-environment/oikos-sdk";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@/components/toast";
import { logCompanyEvent } from "@/libs/observe-events";
import { useCompaniesStore } from "@/stores/companies-store";

type CreateCompanyBody = PostV1CompaniesData["body"];

export function useCreateCompany() {
	const addCompany = useCompaniesStore(s => s.addCompany);

	return useMutation({
		mutationFn: (body: CreateCompanyBody) => postV1Companies({ body }),
		onSuccess: data => {
			if (data.data?.company) {
				addCompany(data.data.company);
			}
			logCompanyEvent("company.created", {
				success: true,
				companyId: data.data?.company?.id ?? "",
			});
			toast.success("Empresa cadastrada com sucesso!");
		},
		onError: () => {
			logCompanyEvent("company.created", { success: false });
			toast.error("Erro ao cadastrar empresa", "Tente novamente.");
		},
	});
}
