"use client";

import { type CameraType, CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { useState } from "react";
import { Button, Text, TouchableOpacity, View } from "react-native";

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();

  function toggleCameraFacing() {
    setFacing(current => (current === "back" ? "front" : "back"));
  }

  if (!permission) {
    return <View className="flex-1 bg-black" />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 justify-center gap-3 bg-black px-6">
        <Text className="pb-2 text-center text-white">
          Precisamos da permissao de camera para continuar.
        </Text>
        <Button onPress={requestPermission} title="Conceder permissao" />
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
      <CameraView style={{ flex: 1 }} facing={facing} />

      <View className="absolute left-0 right-0 top-16 items-center">
        <TouchableOpacity
          className="rounded-full bg-black/50 px-4 py-2"
          onPress={() => router.back()}
        >
          <Text className="text-white">Fechar</Text>
        </TouchableOpacity>
      </View>

      <View className="absolute bottom-16 left-0 right-0 flex-row px-10">
        <TouchableOpacity
          className="flex-1 items-center rounded-full bg-black/50 py-3"
          onPress={toggleCameraFacing}
        >
          <Text className="text-lg font-semibold text-white">
            Alternar camera
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
