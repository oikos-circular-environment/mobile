import {
	deleteV1ComplaintsByIdResolutionsAttachmentsByAttachmentId,
	patchV1ComplaintsByIdResolutionsByResolutionId,
	postV1ComplaintsByIdResolutions,
	postV1ComplaintsByIdResolutionsAttachments,
} from "@oikos-circular-environment/oikos-sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type * as ImagePicker from "expo-image-picker";
import { Observe } from "expo-observe";
import { router } from "expo-router";
import { useState } from "react";
import type { Company } from "@/components/complaints/company-picker-bottom-sheet";
import type { UploadProgress } from "@/components/complaints/hooks/upload-progress";
import { toast } from "@/components/toast";
import { compressMedia } from "@/libs/media/compression";
import {
	formatFileSize,
	getFileSize,
	MAX_FILE_SIZE_BYTES,
} from "@/libs/media/validation";
import { logComplaintEvent } from "@/libs/observe-events";

type ResolutionMutationInput = {
	description: string;
	company: Company | null;
	assets: ImagePicker.ImagePickerAsset[];
	removedAttachmentIds: Set<string>;
};

type UseResolutionMutationParams = {
	complaintId: string;
	isEditMode: boolean;
	resolutionId?: string;
};

export function useResolutionMutation({
	complaintId,
	isEditMode,
	resolutionId,
}: UseResolutionMutationParams) {
	const queryClient = useQueryClient();
	const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
		null,
	);

	const mutation = useMutation({
		mutationFn: async ({
			description,
			company,
			assets,
			removedAttachmentIds,
		}: ResolutionMutationInput) => {
			if (!complaintId) throw new Error("Dados inválidos.");

			const compressed: Array<{ uri: string; name: string; type: string }> = [];
			for (let i = 0; i < assets.length; i++) {
				const asset = assets[i];
				setUploadProgress({
					phase: "compressing",
					current: i + 1,
					total: assets.length,
				});
				const isPhoto = asset.type === "image";
				let compressedUri: string;
				try {
					compressedUri = await compressMedia(
						asset.uri,
						isPhoto ? "photo" : "video",
					);
				} catch (error) {
					Observe.reportError(error);
					throw new Error("MEDIA_PROCESSING_FAILED");
				}
				const size = getFileSize(compressedUri);
				if (size != null && size > MAX_FILE_SIZE_BYTES) {
					throw new Error("FILE_TOO_LARGE");
				}
				compressed.push({
					uri: compressedUri,
					name:
						asset.fileName ??
						`resolution_${complaintId}_${Date.now()}.${isPhoto ? "jpg" : "mp4"}`,
					type: isPhoto ? "image/jpeg" : "video/mp4",
				});
			}

			if (isEditMode && resolutionId) {
				await patchV1ComplaintsByIdResolutionsByResolutionId({
					path: { id: complaintId, resolutionId },
					body: {
						description,
						...(company ? { company_id: company.id } : {}),
					},
				});
				for (const attachmentId of removedAttachmentIds) {
					await deleteV1ComplaintsByIdResolutionsAttachmentsByAttachmentId({
						path: { id: complaintId, attachmentId },
					});
				}
			} else {
				await postV1ComplaintsByIdResolutions({
					path: { id: complaintId },
					body: {
						description,
						...(company ? { company_id: company.id } : {}),
					},
				});
			}

			for (let i = 0; i < compressed.length; i++) {
				const media = compressed[i];
				setUploadProgress({
					phase: "uploading",
					current: i + 1,
					total: compressed.length,
				});
				const formData = new FormData();
				formData.append("file", {
					uri: media.uri,
					name: media.name,
					type: media.type,
				} as unknown as Blob);
				await postV1ComplaintsByIdResolutionsAttachments({
					path: { id: complaintId },
					body: formData as unknown as undefined,
				});
			}
		},
		onSuccess: () => {
			setUploadProgress(null);
			queryClient.invalidateQueries({
				queryKey: ["complaint", "resolutions", complaintId],
			});
			logComplaintEvent("complaint.resolved", {
				success: true,
				action: isEditMode ? "updated" : "created",
			});
			toast.success(
				isEditMode ? "Resolução atualizada!" : "Resolução publicada!",
				isEditMode
					? "Sua resolução foi atualizada."
					: "Sua resolução foi registrada.",
			);
			router.back();
		},
		onError: error => {
			setUploadProgress(null);
			logComplaintEvent("complaint.resolved", {
				success: false,
				action: isEditMode ? "updated" : "created",
			});
			if (error instanceof Error && error.message === "FILE_TOO_LARGE") {
				toast.error(
					"Arquivo muito grande",
					`Um arquivo excede ${formatFileSize(MAX_FILE_SIZE_BYTES)} após compressão. Reduza a qualidade ou duração.`,
				);
				return;
			}
			if (
				error instanceof Error &&
				error.message === "MEDIA_PROCESSING_FAILED"
			) {
				toast.error(
					"Falha ao processar mídia",
					"Não foi possível preparar os anexos. Tente novamente.",
				);
				return;
			}
			toast.error(
				"Erro",
				`Não foi possível ${isEditMode ? "atualizar" : "publicar"} a resolução.`,
			);
		},
	});

	return { mutation, uploadProgress };
}
