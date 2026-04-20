import { Image } from "expo-image";
import type { VideoThumbnail } from "expo-video";
import { createVideoPlayer } from "expo-video";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";

type MediaThumbnailState = VideoThumbnail | "failed";

type MediaThumbnailProps = {
  mediaType: "photo" | "video";
  uri?: string;
  loadingLabel?: string;
  fallbackLabel?: string;
};

export function MediaThumbnail({
  mediaType,
  uri,
  loadingLabel = "Carregando",
  fallbackLabel = "MEDIA",
}: MediaThumbnailProps) {
  const [thumbnail, setThumbnail] = useState<MediaThumbnailState | undefined>(
    undefined,
  );

  useEffect(() => {
    let isMounted = true;

    if (mediaType === "photo") {
      setThumbnail(undefined);
      return () => {
        isMounted = false;
      };
    }

    if (!uri) {
      setThumbnail(undefined);
      return () => {
        isMounted = false;
      };
    }

    const generateVideoThumbnail = async () => {
      setThumbnail(undefined);

      try {
        const player = createVideoPlayer({ uri });
        const [result] = await player.generateThumbnailsAsync(0.5, {
          maxHeight: 240,
        });

        if (!isMounted) {
          return;
        }

        setThumbnail(result ?? "failed");
      } catch {
        if (!isMounted) {
          return;
        }

        setThumbnail("failed");
      }
    };

    void generateVideoThumbnail();

    return () => {
      isMounted = false;
    };
  }, [mediaType, uri]);

  if (mediaType === "photo") {
    if (!uri) {
      return (
        <View className="flex-1 items-center justify-center bg-zinc-700">
          <Text className="text-[10px] text-white/70">{fallbackLabel}</Text>
        </View>
      );
    }

    return (
      <Image
        source={{ uri }}
        style={{ height: "100%", width: "100%", borderRadius: 6 }}
        contentFit="cover"
      />
    );
  }

  if (!uri || !thumbnail) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-700">
        <Spinner size="small" color="grey" />
        <Text className="mt-1 text-[10px] text-white/70">{loadingLabel}</Text>
      </View>
    );
  }

  if (thumbnail === "failed") {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-800">
        <Text className="text-[10px] font-semibold text-white">
          {fallbackLabel}
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={thumbnail}
      style={{ height: "100%", width: "100%", borderRadius: 6 }}
      contentFit="cover"
    />
  );
}
