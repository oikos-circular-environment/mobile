"use client";

import {
  type CameraType,
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
} from "expo-camera";
import { Image } from "expo-image";
import { router } from "expo-router";
import { ArrowRight } from "lucide-react-native";
import { useRef, useState } from "react";
import { Button, Text, TouchableOpacity, View } from "react-native";

type CaptureMode = "photo" | "video";

type MemoryCapture = {
  id: string;
  uri: string;
  type: CaptureMode;
};

export default function CameraScreen() {
  const cameraRef = useRef<CameraView | null>(null);
  const [facing, setFacing] = useState<CameraType>("back");
  const [mode, setMode] = useState<CaptureMode>("photo");
  const [isRecording, setIsRecording] = useState(false);
  const [captures, setCaptures] = useState<MemoryCapture[]>([]);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] =
    useMicrophonePermissions();
  const latestCapture = captures[0] ?? null;
  const previousCapture = captures[1] ?? null;

  function saveInMemory(uri: string, type: CaptureMode) {
    setCaptures(current => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        uri,
        type,
      },
      ...current,
    ]);
  }

  async function ensureMicrophonePermission() {
    if (microphonePermission?.granted) {
      return true;
    }

    const permission = await requestMicrophonePermission();
    return permission.granted;
  }

  async function handleCapture() {
    if (!cameraRef.current) {
      return;
    }

    if (mode === "photo") {
      const picture = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });
      if (picture?.uri) {
        saveInMemory(picture.uri, "photo");
      }
      return;
    }

    if (isRecording) {
      cameraRef.current.stopRecording();
      return;
    }

    const canRecord = await ensureMicrophonePermission();
    if (!canRecord) {
      return;
    }

    try {
      setIsRecording(true);
      const video = await cameraRef.current.recordAsync({ maxDuration: 120 });
      if (video?.uri) {
        saveInMemory(video.uri, "video");
      }
    } finally {
      setIsRecording(false);
    }
  }

  if (!cameraPermission) {
    return <View className="flex-1 bg-black" />;
  }

  if (!cameraPermission.granted) {
    return (
      <View className="flex-1 justify-center gap-3 bg-black px-6">
        <Text className="text-center text-white">
          Precisamos da permissao de camera para continuar.
        </Text>
        <Button onPress={requestCameraPermission} title="Conceder permissao" />
        <TouchableOpacity
          className="items-center"
          onPress={() => router.back()}
        >
          <Text className="text-sm text-white/80">Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing={facing}
        mode={mode === "photo" ? "picture" : "video"}
      />

      <View className="absolute left-0 right-0 top-16 flex-row justify-between px-5">
        <TouchableOpacity
          className="rounded-full bg-black/50 px-4 py-2"
          onPress={() => router.back()}
        >
          <Text className="text-white">Fechar</Text>
        </TouchableOpacity>
      </View>

      <View className="absolute bottom-44 left-0 right-0 px-4">
        <View className="flex-row rounded-2xl bg-white/90 p-1">
          <TouchableOpacity
            className={`flex-1 items-center rounded-xl py-3 ${
              mode === "video" ? "bg-lime-900" : "bg-transparent"
            }`}
            onPress={() => setMode("video")}
            disabled={isRecording}
          >
            <Text
              className={`text-lg font-medium ${
                mode === "video" ? "text-white" : "text-zinc-500"
              }`}
            >
              Video
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 items-center rounded-xl py-3 ${
              mode === "photo" ? "bg-lime-900" : "bg-transparent"
            }`}
            onPress={() => setMode("photo")}
            disabled={isRecording}
          >
            <Text
              className={`text-lg font-medium ${
                mode === "photo" ? "text-white" : "text-zinc-500"
              }`}
            >
              Foto
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="absolute bottom-10 left-0 right-0 px-4">
        <View className="flex-row items-end justify-between">
          <TouchableOpacity
            className="h-20 w-20 overflow-hidden rounded-xl"
            disabled={latestCapture == null}
          >
            {latestCapture ? (
              <>
                {previousCapture ? (
                  <View className="absolute -left-1 -top-1 h-full w-full rounded-xl bg-zinc-700/70" />
                ) : null}
                {latestCapture.type === "photo" ? (
                  <Image
                    source={{ uri: latestCapture.uri }}
                    contentFit="cover"
                    style={{ flex: 1 }}
                  />
                ) : (
                  <View className="flex-1 items-center justify-center bg-zinc-800">
                    <Text className="text-[10px] font-semibold text-white">
                      VIDEO
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <View className="flex-1 items-center justify-center bg-zinc-700/80">
                <Text className="text-[10px] text-white/70">Sem midia</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className={`h-28 w-28 items-center justify-center rounded-full border-4 border-white ${
              mode === "video" && isRecording ? "bg-red-600" : "bg-[#0b1a3a]/85"
            }`}
            onPress={handleCapture}
          >
            <View className="h-24 w-24 rounded-full border-2 border-white/90" />
          </TouchableOpacity>

          <TouchableOpacity
            className={`h-20 w-20 items-center justify-center rounded-xl ${
              captures.length > 0 ? "bg-white" : "bg-white/40"
            }`}
            onPress={() => router.back()}
            disabled={captures.length === 0}
          >
            <ArrowRight size={34} color="#3d6300" strokeWidth={2.2} />
          </TouchableOpacity>
        </View>

        <View className="mt-2 items-center">
          <Text className="text-xs text-white/85">
            {mode === "photo"
              ? "Toque para capturar foto"
              : isRecording
                ? "Gravando video"
                : "Toque para iniciar video"}
          </Text>
        </View>
      </View>
    </View>
  );
}
