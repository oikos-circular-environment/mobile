"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import {
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
} from "expo-camera";
import { Image } from "expo-image";
import { router } from "expo-router";
import { ArrowLeft, ArrowRight } from "lucide-react-native";
import { useMemo, useRef, useState } from "react";
import { Button, TouchableOpacity, View } from "react-native";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { useGeospatial } from "@/contexts/geospatial-context";
import {
  formatHeading,
  formatMeters,
  formatSexagesimalCoordinate,
} from "@/libs/geospatial";
import {
  type ComplaintCaptureDraft,
  type ComplaintCaptureMode,
  saveComplaintCreateDraft,
} from "@/libs/memory/complaint-create";

const overlayTextStrokeStyle = {
  textShadowColor: "rgba(0, 0, 0, 0.92)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 6,
};

export default function ComplaintCameraScreen() {
  const cameraRef = useRef<CameraView | null>(null);
  const [mode, setMode] = useState<ComplaintCaptureMode>("photo");
  const [isRecording, setIsRecording] = useState(false);
  const [captures, setCaptures] = useState<ComplaintCaptureDraft[]>([]);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] =
    useMicrophonePermissions();

  const { addresses, currentDate, location, heading } = useGeospatial();

  const latestCapture = captures[0] ?? null;
  const previousCapture = captures[1] ?? null;

  const date = useMemo(
    () => format(currentDate, "dd/MM/yyyy", { locale: ptBR }),
    [currentDate],
  );
  const time = useMemo(
    () => format(currentDate, "HH:mm:ss", { locale: ptBR }),
    [currentDate],
  );
  const dayOfWeek = useMemo(
    () => format(currentDate, "EEEE", { locale: ptBR }),
    [currentDate],
  );

  const addressFormatted = useMemo(() => {
    if (addresses.length === 0) {
      return "indisponivel";
    }

    const address = addresses[0];
    return `${address.street}, ${address.streetNumber}, ${address.district}, ${address.city}, ${address.region} - ${address.postalCode}`;
  }, [addresses]);

  const headingFormatted = useMemo(
    () =>
      formatHeading(heading?.magHeading, {
        includeCompass: true,
      }),
    [heading?.magHeading],
  );

  const latitudeFormatted = useMemo(
    () =>
      location?.coords.latitude != null
        ? formatSexagesimalCoordinate(location.coords.latitude, "latitude")
        : "indisponivel",
    [location?.coords.latitude],
  );

  const longitudeFormatted = useMemo(
    () =>
      location?.coords.longitude != null
        ? formatSexagesimalCoordinate(location.coords.longitude, "longitude")
        : "indisponivel",
    [location?.coords.longitude],
  );

  const altitudeFormatted = useMemo(
    () => formatMeters(location?.coords.altitude),
    [location?.coords.altitude],
  );

  function saveInMemory(uri: string, type: ComplaintCaptureMode) {
    const snapshot: ComplaintCaptureDraft = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      uri,
      type,
      createdAt: `${date} ${time}`,
      dayOfWeek,
      address: addressFormatted,
      latitude: location?.coords.latitude ?? null,
      longitude: location?.coords.longitude ?? null,
      latitudeFormatted,
      longitudeFormatted,
      altitudeFormatted,
      headingFormatted,
      observation: "",
    };

    setCaptures(current => [snapshot, ...current]);
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

  const handleAdvance = () => {
    if (captures.length === 0) {
      return;
    }

    saveComplaintCreateDraft({ captures });
    router.push("/complaints/review" as never);
  };

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
        mode={mode === "photo" ? "picture" : "video"}
      />

      <View className="absolute left-0 right-0 top-16 flex-row justify-between px-5">
        <TouchableOpacity
          className="rounded-xl bg-white/90 p-3"
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color="#4B5563" strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      <View className="absolute bottom-70 left-0 right-0 px-4">
        <View className="rounded-2xl bg-black/35 p-3">
          <Heading
            className="text-white text-4xl"
            style={overlayTextStrokeStyle}
          >
            {date}
          </Heading>
          <View className="flex-row gap-4">
            <Text className="text-white text-xl" style={overlayTextStrokeStyle}>
              {time}
            </Text>
            <Text className="text-white text-xl" style={overlayTextStrokeStyle}>
              {dayOfWeek}
            </Text>
          </View>
          <View className="mt-1">
            <Text className="text-white text-md" style={overlayTextStrokeStyle}>
              {addressFormatted}
            </Text>
            <Text className="text-white text-md" style={overlayTextStrokeStyle}>
              {latitudeFormatted}, {longitudeFormatted}
            </Text>
            <Text className="text-white text-md" style={overlayTextStrokeStyle}>
              {altitudeFormatted}
            </Text>
            <Text className="text-white text-md" style={overlayTextStrokeStyle}>
              {headingFormatted}
            </Text>
          </View>
        </View>
      </View>

      <View className="absolute bottom-46 left-0 right-0 px-4">
        <View className="flex-row rounded-2xl bg-white/90 p-1">
          <TouchableOpacity
            className={`flex-1 items-center rounded-xl py-3 ${
              mode === "video" ? "bg-lime-900" : "bg-transparent"
            }`}
            onPress={() => setMode("video")}
            disabled={isRecording}
          >
            <Text
              className={`text-lg ${mode === "video" ? "text-white" : "text-zinc-500"}`}
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
              className={`text-lg ${mode === "photo" ? "text-white" : "text-zinc-500"}`}
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
            disabled
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
            className={`size-22 items-center justify-center rounded-full border-4 border-white ${
              mode === "video" && isRecording ? "bg-red-600" : "bg-white"
            }`}
            onPress={handleCapture}
          >
            <View className="h-24 w-24 rounded-full border-2 border-white/50" />
          </TouchableOpacity>

          <TouchableOpacity
            className={`h-20 w-20 items-center justify-center rounded-xl ${
              captures.length > 0 ? "bg-white" : "bg-white/40"
            }`}
            onPress={handleAdvance}
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
