import {
	postV1Support,
	postV1SupportByIdAttachments,
} from "@oikos-circular-environment/oikos-sdk";
import { useMutation } from "@tanstack/react-query";
import type * as ImagePicker from "expo-image-picker";
import { Observe } from "expo-observe";
import { toast } from "@/components/toast";
import { compressMedia } from "@/libs/media-compression";
import {
	formatFileSize,
	getFileSize,
	MAX_FILE_SIZE_BYTES,
} from "@/libs/media-validation";
import type { CreateSupportRequestBody } from "@/libs/types/support";
import { useSupportStore } from "@/stores/support-store";

type CreateSupportRequestParams = {
	body: CreateSupportRequestBody;
	attachments: ImagePicker.ImagePickerAsset[];
};

export function useCreateSupportRequest() {
	const addSupport = useSupportStore(s => s.addSupport);

	return useMutation({
		mutationFn: async ({ body, attachments }: CreateSupportRequestParams) => {
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
						`support_${Date.now()}.${isPhoto ? "jpg" : "mp4"}`,
					type: isPhoto ? "image/jpeg" : "video/mp4",
				});
			}

			const res = await postV1Support({ body });
			const support = res.data?.support;
			if (!support) throw new Error("NO_SUPPORT_RETURNED");

			let attachmentUploadFailed = false;
			for (const media of compressed) {
				try {
					const formData = new FormData();
					formData.append("file", {
						uri: media.uri,
						name: media.name,
						type: media.type,
					} as unknown as Blob);
					await postV1SupportByIdAttachments({
						path: { id: support.id },
						body: formData as unknown as undefined,
					});
				} catch (error) {
					Observe.reportError(error);
					attachmentUploadFailed = true;
				}
			}

			return { support, attachmentUploadFailed };
		},
		onSuccess: ({ support, attachmentUploadFailed }) => {
			addSupport(support);
			if (attachmentUploadFailed) {
				toast.warning(
					"Chamado enviado",
					"Um ou mais anexos falharam ao subir. Tente reenviá-los depois.",
				);
			} else {
				toast.success(
					"Chamado enviado!",
					"Seu chamado de suporte foi registrado.",
				);
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
			toast.error("Erro", "Não foi possível enviar o chamado de suporte.");
		},
	});
}
