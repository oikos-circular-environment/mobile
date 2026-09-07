import { postV1SupportByIdCancel } from "@oikos-circular-environment/oikos-sdk";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@/components/toast";
import { useSupportStore } from "@/stores/support-store";

export function useCancelSupportRequest(id: string) {
	const updateSupport = useSupportStore(s => s.updateSupport);

	return useMutation({
		mutationFn: () => postV1SupportByIdCancel({ path: { id } }),
		onSuccess: data => {
			if (data.data?.support) {
				updateSupport(id, { status: data.data.support.status });
			}
			toast.success("Chamado cancelado", "Seu chamado foi cancelado.");
		},
		onError: () => {
			toast.error("Erro", "Não foi possível cancelar o chamado.");
		},
	});
}
