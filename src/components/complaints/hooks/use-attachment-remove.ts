import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "@/components/toast";
import { useComplaintCreation } from "@/contexts/complaint-creation-context";
import { deleteV1ComplaintsByIdAttachmentsByAttachmentId } from "@/libs/oikos-sdk";
import type { DraftAttachment } from "@/libs/types/complaint";

export function useAttachmentRemove(complaintId: string | undefined) {
	const { removeAttachment } = useComplaintCreation();
	const [pendingDelete, setPendingDelete] = useState<DraftAttachment | null>(
		null,
	);

	const deleteMutation = useMutation({
		mutationFn: (attachment: DraftAttachment) => {
			if (!complaintId)
				throw new Error("complaintId required to delete API attachment");
			return deleteV1ComplaintsByIdAttachmentsByAttachmentId({
				path: { id: complaintId, attachmentId: attachment.id },
			});
		},
		onSuccess: (_, attachment) => {
			removeAttachment(attachment.id);
			setPendingDelete(null);
			toast.success("Anexo removido", "O arquivo foi excluído da denúncia.");
		},
		onError: () => toast.error("Erro", "Não foi possível remover o anexo."),
	});

	const handleRemove = (attachment: DraftAttachment) => {
		if (attachment.source === "api") {
			setPendingDelete(attachment);
		} else {
			removeAttachment(attachment.id);
		}
	};

	return {
		handleRemove,
		pendingDelete,
		confirmDelete: () => {
			if (pendingDelete) deleteMutation.mutate(pendingDelete);
		},
		cancelDelete: () => setPendingDelete(null),
		isDeleting: deleteMutation.isPending,
	};
}
