import * as ImagePicker from "expo-image-picker";
import { useRef, useState } from "react";
import { toast } from "@/components/toast";

export type PickImageOptions = ImagePicker.ImagePickerOptions & {
	requestPermission?: boolean;
};

export function usePickImage() {
	const [isPicking, setIsPicking] = useState(false);
	const isPickingRef = useRef(false);

	const pickImage = async (
		options: PickImageOptions,
	): Promise<ImagePicker.ImagePickerAsset[] | null> => {
		if (isPickingRef.current) return null;
		isPickingRef.current = true;
		setIsPicking(true);
		try {
			const { requestPermission, ...pickerOptions } = options;
			if (requestPermission) {
				const permission =
					await ImagePicker.requestMediaLibraryPermissionsAsync();
				if (!permission.granted) {
					toast.error(
						"Permissão negada",
						"Permita o acesso à galeria nas configurações.",
					);
					return null;
				}
			}
			const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
			return result.canceled ? null : result.assets;
		} finally {
			isPickingRef.current = false;
			setIsPicking(false);
		}
	};

	return { pickImage, isPicking };
}
