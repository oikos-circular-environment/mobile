"use client";

import { router, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { ImagePreviewViewer } from "@/components/common/image-preview-viewer";
import { VideoPreviewPlayer } from "@/components/common/video-preview-player";
import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useComplaintCreateContext } from "@/contexts/create-complaint-context";

export default function ComplaintPreviewScreen() {
  const { captureId } = useLocalSearchParams<{ captureId?: string }>();
  const { captures } = useComplaintCreateContext();

  const previewCapture = captures.find(capture => capture.id === captureId);
  const captureUri = previewCapture?.capture.object?.uri;

  return (
    <View className="flex-1">
      {previewCapture && captureUri ? (
        previewCapture.capture.type === "photo" ? (
          <ImagePreviewViewer uri={captureUri} />
        ) : (
          <VideoPreviewPlayer uri={captureUri} />
        )
      ) : (
        <View
          className="items-center justify-center rounded-lg bg-zinc-100"
          style={{ flex: 1 }}
        >
          <Text className="text-sm text-gray-500">
            Não foi possível carregar a captura.
          </Text>
        </View>
      )}

      <View className="absolute bottom-12 left-0 right-0 items-center justify-center">
        <Button variant="outline" size="lg" onPress={() => router.back()}>
          <ButtonText>Fechar visualização</ButtonText>
        </Button>
      </View>
    </View>
  );
}
