import type * as ImagePicker from "expo-image-picker";
import { toast } from "@/components/toast";
import { isValidMimeType } from "@/libs/media-validation";
import { type PickImageOptions, usePickImage } from "@/libs/use-pick-image";

export function usePickValidatedMedia() {
	const { pickImage, isPicking } = usePickImage();

	const pickValidatedMedia = async (
		existingUris: Iterable<string>,
		options: PickImageOptions,
	): Promise<ImagePicker.ImagePickerAsset[]> => {
		const assets = await pickImage(options);
		if (!assets) return [];

		const existing = new Set(existingUris);
		const validAssets: ImagePicker.ImagePickerAsset[] = [];
		let skippedCount = 0;

		for (const asset of assets) {
			if (existing.has(asset.uri)) continue;
			if (!isValidMimeType(asset.mimeType)) {
				skippedCount++;
				continue;
			}
			validAssets.push(asset);
		}

		if (skippedCount > 0) {
			toast.warning(
				"Arquivos ignorados",
				`${skippedCount} arquivo(s) com formato não suportado. Use JPEG, PNG, MP4, MOV ou WEBM.`,
			);
		}

		return validAssets;
	};

	return { pickValidatedMedia, isPicking };
}
