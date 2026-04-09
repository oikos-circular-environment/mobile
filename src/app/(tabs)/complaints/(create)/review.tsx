"use client";

import { Image } from "expo-image";
import { router } from "expo-router";
import { ShieldAlert } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { ComplaintMap } from "@/components/complaints/complaint-map";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Input, InputField } from "@/components/ui/input";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import {
  clearComplaintCreateDraft,
  getComplaintCreateDraft,
  updateComplaintCaptureObservation,
} from "@/libs/memory/complaint-create";

export default function ComplaintReviewScreen() {
  const initialDraft = getComplaintCreateDraft();

  const [selectedCaptureId, setSelectedCaptureId] = useState(
    initialDraft?.captures[0]?.id ?? "",
  );
  const [, setRefreshToken] = useState(0);

  const draft = getComplaintCreateDraft();

  const selectedCapture =
    draft?.captures.find(capture => capture.id === selectedCaptureId) ??
    draft?.captures[0] ??
    null;

  if (!draft || draft.captures.length === 0 || !selectedCapture) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-white px-6">
        <Heading size="lg">Nenhuma mídia capturada</Heading>
        <Button onPress={() => router.replace("/complaints" as never)}>
          <ButtonText>Voltar para denúncias</ButtonText>
        </Button>
      </View>
    );
  }

  const handleConfirm = () => {
    clearComplaintCreateDraft();
    router.replace("/complaints" as never);
  };

  const handleBack = () => {
    router.back();
  };

  const handleObservationChange = (value: string) => {
    updateComplaintCaptureObservation(selectedCapture.id, value);
    setRefreshToken(current => current + 1);
  };

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-3 px-4 py-4 pb-8"
    >
      <Card className="flex-row items-center gap-3 bg-gray-100 p-3 shadow-none">
        <View className="size-14 items-center justify-center rounded-lg bg-lime-800">
          <ShieldAlert size={24} color="#FFFFFF" strokeWidth={2.2} />
        </View>
        <View className="flex-1">
          <Heading size="md">Atenção</Heading>
          <Text className="text-sm text-gray-500">
            Por questões de segurança e consistência dos dados alguns dados não
            podem ser modificados.
          </Text>
        </View>
      </Card>

      <View className="gap-2">
        <Heading size="md">Descrição</Heading>
        <Card className="p-3 shadow-none">
          <Text className="text-sm text-gray-700">
            Revise as informações da denúncia e adicione observações para cada
            mídia capturada antes de confirmar.
          </Text>
        </Card>
      </View>

      <View className="flex-row gap-2">
        <Card size="sm" className="flex-1 gap-1 p-2 shadow-none">
          <Text className="text-xs text-gray-500">Data e hora</Text>
          <Text>{selectedCapture.createdAt}</Text>
        </Card>
        <Card size="sm" className="flex-1 gap-1 p-2 shadow-none">
          <Text className="text-xs text-gray-500">Dia da semana</Text>
          <Text>{selectedCapture.dayOfWeek}</Text>
        </Card>
      </View>

      <View className="flex-row gap-2">
        <Card size="sm" className="flex-1 gap-1 p-2 shadow-none">
          <Text className="text-xs text-gray-500">Latitude</Text>
          <Text>{selectedCapture.latitudeFormatted}</Text>
        </Card>
        <Card size="sm" className="flex-1 gap-1 p-2 shadow-none">
          <Text className="text-xs text-gray-500">Longitude</Text>
          <Text>{selectedCapture.longitudeFormatted}</Text>
        </Card>
      </View>

      <View className="flex-row gap-2">
        <Card size="sm" className="flex-1 gap-1 p-2 shadow-none">
          <Text className="text-xs text-gray-500">Altura</Text>
          <Text>{selectedCapture.altitudeFormatted}</Text>
        </Card>
        <Card size="sm" className="flex-1 gap-1 p-2 shadow-none">
          <Text className="text-xs text-gray-500">Bússola</Text>
          <Text>{selectedCapture.headingFormatted}</Text>
        </Card>
      </View>

      <View className="gap-2">
        <Heading size="md">Endereço</Heading>
        <Card size="sm" className="p-2 shadow-none">
          <Text>{selectedCapture.address}</Text>
        </Card>
      </View>

      <ComplaintMap
        latitude={selectedCapture.latitude ?? -16.487742}
        longitude={selectedCapture.longitude ?? -54.582445}
      />

      <View className="gap-2">
        <Heading size="md">Observação da mídia selecionada</Heading>
        <Input className="min-h-20">
          <InputField
            multiline
            textAlignVertical="top"
            numberOfLines={4}
            placeholder="Adicione observações sobre esta evidência"
            value={selectedCapture.observation}
            onChangeText={handleObservationChange}
          />
        </Input>
      </View>

      <View className="gap-2">
        <Heading size="md">Fotos e vídeos</Heading>
        <Text className="text-sm text-gray-500">
          Selecione uma mídia para conferir os dados e acrescentar observações
          ou mantenha pressionado para deletar.
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2 pr-4">
            {draft.captures.map(capture => (
              <Pressable
                key={capture.id}
                className={`h-24 w-24 overflow-hidden rounded-lg border ${
                  capture.id === selectedCapture.id
                    ? "border-lime-800"
                    : "border-gray-200"
                }`}
                onPress={() => setSelectedCaptureId(capture.id)}
              >
                {capture.type === "photo" ? (
                  <Image
                    source={{ uri: capture.uri }}
                    className="h-full w-full"
                    contentFit="cover"
                  />
                ) : (
                  <View className="flex-1 items-center justify-center bg-zinc-800">
                    <Text className="text-[10px] font-semibold text-white">
                      VIDEO
                    </Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      <View className="flex-row gap-3 pt-2">
        <Button variant="outline" className="flex-1" onPress={handleBack}>
          <ButtonText>Voltar</ButtonText>
        </Button>
        <Button className="flex-1 bg-lime-800" onPress={handleConfirm}>
          <ButtonText className="text-white">Confirmar</ButtonText>
        </Button>
      </View>
    </ScrollView>
  );
}
