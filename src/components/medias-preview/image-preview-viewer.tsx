import { Image } from "expo-image";
import { getAuthenticatedImageHeaders } from "@/libs/api/oikos-api";

type ImagePreviewViewerProps = {
	uri: string;
};

export function ImagePreviewViewer({ uri }: ImagePreviewViewerProps) {
	return (
		<Image
			source={{ uri, headers: getAuthenticatedImageHeaders() }}
			style={{ flex: 1 }}
			contentFit="contain"
		/>
	);
}
