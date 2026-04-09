"use client";

import { Image } from "expo-image";
import type { VideoThumbnail } from "expo-video";
import { createVideoPlayer, useVideoPlayer, VideoView } from "expo-video";
import { CirclePlay, Eye, Trash2 } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
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

type ComplaintCaptureCarouselProps = {
  captures: ComplaintCapture[];
  selectedCaptureId: string;
  onSelectCapture: (captureId: string) => void;
  onDeleteCapture: (captureId: string) => void;
};

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
  const [videoThumbnails, setVideoThumbnails] = useState<
    Record<string, VideoThumbnail | null>
  >({});
  const [actionCaptureId, setActionCaptureId] = useState("");
  const [previewCaptureId, setPreviewCaptureId] = useState("");

  const selectedActionCapture = useMemo(
    () => captures.find(capture => capture.id === actionCaptureId) ?? null,
    [actionCaptureId, captures],
  );

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
        capture => !videoThumbnails[capture.id],
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
              [capture.id]: result ?? null,
            }));
          } catch {
            if (!isMounted) {
              return;
            }

            setVideoThumbnails(current => ({
              ...current,
              [capture.id]: null,
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

  const closeActionMenu = () => {
    setActionCaptureId("");
  };

  const closePreview = () => {
    setPreviewCaptureId("");
  };

  const handleDelete = () => {
    if (!selectedActionCapture) {
      return;
    }

    onDeleteCapture(selectedActionCapture.id);
    closeActionMenu();

    if (previewCaptureId === selectedActionCapture.id) {
      closePreview();
    }
  };

  const handlePreview = () => {
    if (!selectedActionCapture) {
      return;
    }

    setPreviewCaptureId(selectedActionCapture.id);
    closeActionMenu();
  };

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2 pr-4">
          {captures.map(capture => {
            const captureUri = getCaptureUri(capture);
            const videoThumbnailUri = videoThumbnails[capture.id];
            const isSelected = capture.id === selectedCaptureId;
            const canRenderPhoto =
              capture.capture.type === "photo" && captureUri != null;
            const canRenderVideoThumbnail =
              capture.capture.type === "video" && !!videoThumbnailUri;

            return (
              <Pressable
                key={capture.id}
                className={`h-24 w-24 overflow-hidden rounded-lg border ${
                  isSelected ? "border-lime-800" : "border-gray-200"
                }`}
                onPress={() => onSelectCapture(capture.id)}
                onLongPress={() => setActionCaptureId(capture.id)}
                delayLongPress={260}
              >
                {canRenderPhoto ? (
                  <Image
                    source={{ uri: captureUri }}
                    className="h-full w-full"
                    contentFit="cover"
                  />
                ) : canRenderVideoThumbnail ? (
                  <View className="h-full w-full">
                    <Image
                      source={videoThumbnailUri}
                      className="h-full w-full"
                      contentFit="cover"
                    />
                    <View className="absolute inset-0 items-center justify-center bg-black/25">
                      <CirclePlay size={22} color="#FFFFFF" strokeWidth={2.2} />
                    </View>
                  </View>
                ) : (
                  <View className="flex-1 items-center justify-center bg-zinc-800">
                    <Text className="text-[10px] font-semibold text-white">
                      VIDEO
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <Modal
        isOpen={!!selectedActionCapture}
        onClose={closeActionMenu}
        size="sm"
      >
        <ModalBackdrop />
        <ModalContent>
          <ModalHeader>
            <Heading size="md">Ações da captura</Heading>
          </ModalHeader>
          <ModalBody>
            <Text className="text-sm text-gray-600">
              Escolha uma ação para a captura selecionada.
            </Text>
          </ModalBody>
          <ModalFooter className="flex-col items-stretch gap-2">
            <Button className="bg-lime-800" onPress={handlePreview}>
              <Eye size={16} color="#FFFFFF" strokeWidth={2.2} />
              <ButtonText>Previsualizar</ButtonText>
            </Button>
            <Button
              variant="outline"
              className="border-red-300"
              onPress={handleDelete}
            >
              <Trash2 size={16} color="#DC2626" strokeWidth={2.2} />
              <ButtonText className="text-red-600">Deletar captura</ButtonText>
            </Button>
            <Button variant="outline" onPress={closeActionMenu}>
              <ButtonText>Cancelar</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

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
