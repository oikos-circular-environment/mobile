import {
	postV1Denunciations,
	postV1DenunciationsByIdAttachments,
} from "@oikos-circular-environment/oikos-sdk";
import { useMutation } from "@tanstack/react-query";
import type * as ImagePicker from "expo-image-picker";
import { toast } from "@/components/toast";
import { compressMedia } from "@/libs/media-compression";
import {
	formatFileSize,
	getFileSize,
	MAX_FILE_SIZE_BYTES,
} from "@/libs/media-validation";
import type { CreateDenunciationBody } from "@/libs/types/denunciation";
import { useDenunciationStore } from "@/stores/denunciation-store";

type CreateDenunciationParams = {
	body: CreateDenunciationBody;
	attachments: ImagePicker.ImagePickerAsset[];
};

export function useCreateDenunciation() {
	const addDenunciation = useDenunciationStore(s => s.addDenunciation);

	return useMutation({
		mutationFn: async ({ body, attachments }: CreateDenunciationParams) => {
			const compressed: Array<{ uri: string; name: string; type: string }> = [];
			for (const asset of attachments) {
				const isPhoto = asset.type === "image";
				const compressedUri = await compressMedia(
					asset.uri,
					isPhoto ? "photo" : "video",
				);
				const size = getFileSize(compressedUri);
				if (size != null && size > MAX_FILE_SIZE_BYTES) {
					throw new Error("FILE_TOO_LARGE");
				}
				compressed.push({
					uri: compressedUri,
					name:
						asset.fileName ??
						`denunciation_${Date.now()}.${isPhoto ? "jpg" : "mp4"}`,
					type: isPhoto ? "image/jpeg" : "video/mp4",
				});
			}

			const res = await postV1Denunciations({ body });
			const denunciation = res.data?.denunciation;
			if (!denunciation) throw new Error("NO_DENUNCIATION_RETURNED");

			let attachmentUploadFailed = false;
			for (const media of compressed) {
				try {
					const formData = new FormData();
					formData.append("file", {
						uri: media.uri,
						name: media.name,
						type: media.type,
					} as unknown as Blob);
					await postV1DenunciationsByIdAttachments({
						path: { id: denunciation.id },
						body: formData as unknown as undefined,
					});
				} catch {
					attachmentUploadFailed = true;
				}
			}

			return { denunciation, attachmentUploadFailed };
		},
		onSuccess: ({ denunciation, attachmentUploadFailed }) => {
			addDenunciation(denunciation);
			if (attachmentUploadFailed) {
				toast.warning(
					"Denúncia enviada",
					"Um ou mais anexos falharam ao subir. Tente reenviá-los depois.",
				);
			} else {
				toast.success("Denúncia enviada!", "Sua denúncia foi registrada.");
			}
		},
		onError: error => {
			if (error instanceof Error && error.message === "FILE_TOO_LARGE") {
				toast.error(
					"Arquivo muito grande",
					`Um anexo excede ${formatFileSize(MAX_FILE_SIZE_BYTES)} após compressão.`,
				);
				return;
			}
			toast.error("Erro", "Não foi possível enviar a denúncia.");
		},
	});
}
