import { useMutation } from "@tanstack/react-query";
import type { ImagePickerAsset } from "expo-image-picker";
import { toast } from "@/components/toast";
import { compressImage } from "@/libs/media-compression";
import { postV1CompaniesByIdAvatar } from "@/libs/oikos-sdk";
import { useCompaniesStore } from "@/stores/companies-store";

type UploadAvatarParams = {
	companyId: string;
	asset: ImagePickerAsset;
};

export function useUploadCompanyAvatar() {
	const updateCompany = useCompaniesStore(s => s.updateCompany);

	return useMutation({
		mutationFn: async ({ companyId, asset }: UploadAvatarParams) => {
			const compressedUri = await compressImage(asset.uri, "avatar");
			const formData = new FormData();
			formData.append("file", {
				uri: compressedUri,
				name: asset.fileName ?? "image.jpg",
				type: "image/jpeg",
			} as unknown as Blob);

			return postV1CompaniesByIdAvatar({
				path: { id: companyId },
				body: formData as unknown as undefined,
			});
		},
		onSuccess: (data, { companyId }) => {
			if (data.data?.company?.avatar !== undefined) {
				const avatar = data.data.company.avatar;
				const busted = avatar?.url
					? { ...avatar, url: `${avatar.url}?t=${Date.now()}` }
					: avatar;
				updateCompany(companyId, { avatar: busted });
			}
		},
		onError: () => {
			toast.error("Erro ao enviar imagem", "Tente novamente.");
		},
	});
}
