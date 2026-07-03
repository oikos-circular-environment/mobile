import { useMutation } from "@tanstack/react-query";
import { toast } from "@/components/toast";
import type { PostV1CompaniesData } from "@/libs/oikos-sdk";
import { postV1Companies } from "@/libs/oikos-sdk";
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
			toast.success("Empresa cadastrada com sucesso!");
		},
		onError: () => {
			toast.error("Erro ao cadastrar empresa", "Tente novamente.");
		},
	});
}
