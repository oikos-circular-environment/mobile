"use client";

import { router } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

export default function ComplaintsScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-4 px-6">
      <TouchableOpacity
        className="rounded-full bg-lime-800 px-6 py-3"
        onPress={() => router.push("/camera" as never)}
      >
        <Text className="font-semibold text-white">Abrir camera</Text>
      </TouchableOpacity>
    </View>
  );
}
