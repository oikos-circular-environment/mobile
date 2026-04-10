"use client";

import { Image } from "expo-image";
import type { VideoThumbnail } from "expo-video";
import { createVideoPlayer, useVideoPlayer, VideoView } from "expo-video";
import { EyeIcon, Trash2Icon } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Menu, MenuItem, MenuItemLabel } from "@/components/ui/menu";
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/modal";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import type { ComplaintCapture } from "@/libs/types/complaint";
import { cn } from "@/libs/utils";

type ComplaintCaptureCarouselProps = {
  captures: ComplaintCapture[];
  selectedCaptureId: string;
  onSelectCapture: (captureId: string) => void;
  onDeleteCapture: (captureId: string) => void;
};

type VideoThumbnailState = VideoThumbnail | "failed";

const getCaptureUri = (capture: ComplaintCapture) =>
  capture.capture.object?.uri;

function VideoPreviewPlayer({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, setupPlayer => {
    setupPlayer.loop = true;
    setupPlayer.play();
  });

  return (
    <VideoView
      player={player}
      nativeControls
      className="h-72 w-full rounded-lg"
    />
  );
}

export function ComplaintCaptureCarousel({
  captures,
  selectedCaptureId,
  onDeleteCapture,
  onSelectCapture,
}: ComplaintCaptureCarouselProps) {
  // console.log(JSON.stringify(captures, null, 2));

  const [videoThumbnails, setVideoThumbnails] = useState<
    Record<string, VideoThumbnailState>
  >({});
  const [openMenuCaptureId, setOpenMenuCaptureId] = useState("");
  const [previewCaptureId, setPreviewCaptureId] = useState("");

  const previewCapture = useMemo(
    () => captures.find(capture => capture.id === previewCaptureId) ?? null,
    [previewCaptureId, captures],
  );

  useEffect(() => {
    let isMounted = true;

    const generateVideoThumbnails = async () => {
      const videoCaptures = captures.filter(
        capture => capture.capture.type === "video" && getCaptureUri(capture),
      );

      const pending = videoCaptures.filter(
        capture => !Object.hasOwn(videoThumbnails, capture.id),
      );

      if (pending.length === 0) {
        return;
      }

      await Promise.all(
        pending.map(async capture => {
          const uri = getCaptureUri(capture);

          if (!uri) {
            return;
          }

          try {
            const player = createVideoPlayer({ uri });
            const [result] = await player.generateThumbnailsAsync(0.5, {
              maxHeight: 240,
            });

            if (!isMounted) {
              return;
            }

            setVideoThumbnails(current => ({
              ...current,
              [capture.id]: result ?? "failed",
            }));
          } catch {
            if (!isMounted) {
              return;
            }

            setVideoThumbnails(current => ({
              ...current,
              [capture.id]: "failed",
            }));
          }
        }),
      );
    };

    generateVideoThumbnails();

    return () => {
      isMounted = false;
    };
  }, [captures, videoThumbnails]);

  const closePreview = () => {
    setPreviewCaptureId("");
  };

  return (
    <>
      <ScrollView
        horizontal
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}
      >
        <View className="flex-row gap-2 pr-4">
          {captures.map(capture => {
            const captureUri = getCaptureUri(capture);
            const isSelected = capture.id === selectedCaptureId;

            return (
              <Menu
                key={capture.id}
                placement="bottom"
                offset={8}
                useRNModal
                isOpen={openMenuCaptureId === capture.id}
                onClose={() => {
                  setOpenMenuCaptureId(current =>
                    current === capture.id ? "" : current,
                  );
                }}
                trigger={triggerProps => {
                  const { onLongPress: _onLongPress, ...restTriggerProps } =
                    triggerProps;

                  return (
                    <Pressable
                      className={cn(
                        "size-24 p-0.5 overflow-hidden rounded-lg border",
                        isSelected ? "border-lime-800" : "border-gray-200",
                      )}
                      {...restTriggerProps}
                      onPress={() => onSelectCapture(capture.id)}
                      onLongPress={() => {
                        onSelectCapture(capture.id);
                        setOpenMenuCaptureId(capture.id);
                      }}
                      delayLongPress={260}
                      hitSlop={6}
                    >
                      <Image
                        source={{ uri: captureUri }}
                        style={{
                          height: "100%",
                          width: "100%",
                          borderRadius: 6,
                        }}
                        contentFit="cover"
                      />
                    </Pressable>
                  );
                }}
              >
                <MenuItem
                  key={`preview-${capture.id}`}
                  textValue="Previsualizar"
                  onPress={() => {
                    onSelectCapture(capture.id);
                    setPreviewCaptureId(capture.id);
                    setOpenMenuCaptureId("");
                  }}
                >
                  <View className="flex-row items-center gap-2">
                    <EyeIcon size={14} color="#FFFFFF" strokeWidth={2.2} />
                    <MenuItemLabel>Previsualizar</MenuItemLabel>
                  </View>
                </MenuItem>

                <MenuItem
                  key={`delete-${capture.id}`}
                  textValue="Deletar captura"
                  onPress={() => {
                    if (previewCaptureId === capture.id) {
                      closePreview();
                    }

                    setOpenMenuCaptureId("");
                    onDeleteCapture(capture.id);
                  }}
                >
                  <View className="flex-row items-center gap-2">
                    <Trash2Icon size={14} color="#DC2626" strokeWidth={2.2} />
                    <MenuItemLabel className="text-red-600">
                      Deletar captura
                    </MenuItemLabel>
                  </View>
                </MenuItem>
              </Menu>
            );
          })}
        </View>
      </ScrollView>

      <Modal isOpen={!!previewCapture} onClose={closePreview} size="lg">
        <ModalBackdrop />
        <ModalContent>
          <ModalHeader>
            <Heading size="md">Previsualização</Heading>
          </ModalHeader>
          <ModalBody className="mb-2">
            {previewCapture ? (
              previewCapture.capture.type === "photo" &&
              getCaptureUri(previewCapture) ? (
                <Image
                  source={{ uri: getCaptureUri(previewCapture) }}
                  className="h-72 w-full rounded-lg"
                  contentFit="cover"
                />
              ) : getCaptureUri(previewCapture) ? (
                <VideoPreviewPlayer uri={getCaptureUri(previewCapture) ?? ""} />
              ) : (
                <View className="h-40 items-center justify-center rounded-lg bg-zinc-100">
                  <Text className="text-sm text-gray-500">
                    Não foi possível carregar a captura.
                  </Text>
                </View>
              )
            ) : null}
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onPress={closePreview}>
              <ButtonText>Fechar</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
