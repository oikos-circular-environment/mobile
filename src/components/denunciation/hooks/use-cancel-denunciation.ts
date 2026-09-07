import { postV1DenunciationsByIdCancel } from "@oikos-circular-environment/oikos-sdk";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@/components/toast";
import { useDenunciationStore } from "@/stores/denunciation-store";

export function useCancelDenunciation(id: string) {
	const updateDenunciation = useDenunciationStore(s => s.updateDenunciation);

	return useMutation({
		mutationFn: () => postV1DenunciationsByIdCancel({ path: { id } }),
		onSuccess: data => {
			if (data.data?.denunciation) {
				updateDenunciation(id, { status: data.data.denunciation.status });
			}
			toast.success("Denúncia cancelada", "Sua denúncia foi cancelada.");
		},
		onError: () => {
			toast.error("Erro", "Não foi possível cancelar a denúncia.");
		},
	});
}
