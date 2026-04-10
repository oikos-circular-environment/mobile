import { Image } from "expo-image";

type ImagePreviewViewerProps = {
  uri: string;
};

export function ImagePreviewViewer({ uri }: ImagePreviewViewerProps) {
  return <Image source={{ uri }} style={{ flex: 1 }} contentFit="contain" />;
}
