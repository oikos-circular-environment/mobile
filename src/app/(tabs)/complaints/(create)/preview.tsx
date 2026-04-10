"use client";

import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { View } from "react-native";
import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useComplaintCreateContext } from "@/contexts/create-complaint-context";

function VideoPreviewPlayer({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, setupPlayer => {
    setupPlayer.loop = true;
    setupPlayer.play();
  });

  return <VideoView player={player} nativeControls style={{ flex: 1 }} />;
}

export default function ComplaintPreviewScreen() {
  const { captureId } = useLocalSearchParams<{ captureId?: string }>();
  const { captures } = useComplaintCreateContext();

  const previewCapture = captures.find(capture => capture.id === captureId);
  const captureUri = previewCapture?.capture.object?.uri;

  return (
    <View className="flex-1">
      {previewCapture && captureUri ? (
        previewCapture.capture.type === "photo" ? (
          <Image
            source={{ uri: captureUri }}
            style={{ flex: 1 }}
            contentFit="contain"
          />
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
