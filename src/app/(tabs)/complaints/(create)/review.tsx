"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { router } from "expo-router";
import { ShieldAlert } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { KeyboardAvoidingView, ScrollView, View } from "react-native";
import { z } from "zod";
import { ComplaintCaptureCarousel } from "@/components/complaints/complaint-capture-carousel";
import { ComplaintMap } from "@/components/complaints/complaint-map";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlHelper,
  FormControlHelperText,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { Input, InputField } from "@/components/ui/input";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import {
  formatHeading,
  formatMeters,
  formatSexagesimalCoordinate,
} from "@/libs/geospatial";
import {
  type ComplaintCapture,
  type ComplaintType,
  complaintTypeValues,
} from "@/libs/types/complaint";
import { useComplaintCreateContext } from "../../../../contexts/create-complaint-context";

const complaintTypeSchema = z.enum([
  "irregular_disposal",
  "deforestation",
  "burning",
  "vacant_lot",
]);

const reviewSchema = z.object({
  type: complaintTypeSchema,
  observation: z
    .string()
    .max(500, "A observação deve ter no máximo 500 caracteres."),
});

type ReviewFormValues = z.input<typeof reviewSchema>;

const formatAddress = (capture: ComplaintCapture) => {
  const address = capture.geospatial.addresses;

  const parts = [
    address.street,
    address.streetNumber,
    address.district,
    address.city,
    address.region,
    address.postalCode,
  ].filter(Boolean);

  if (parts.length === 0) {
    return "Endereço indisponível";
  }

  return parts.join(", ");
};

export default function ComplaintReviewScreen() {
  const {
    captures,
    clearDraft,
    deleteCapture,
    selectedCapture,
    selectedCaptureId,
    setSelectedCaptureId,
    updateCapture,
  } = useComplaintCreateContext();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      type: selectedCapture?.type ?? "irregular_disposal",
      observation: selectedCapture?.observation ?? "",
    },
  });

  const complaintTypeValue = watch("type");

  const previousSelectedCaptureId = useRef(selectedCapture?.id ?? "");

  useEffect(() => {
    if (!selectedCapture) {
      return;
    }

    if (previousSelectedCaptureId.current === selectedCapture.id) {
      return;
    }

    previousSelectedCaptureId.current = selectedCapture.id;

    reset({
      type: selectedCapture.type,
      observation: selectedCapture.observation,
    });
  }, [selectedCapture, reset]);

  if (captures.length === 0 || !selectedCapture) {
    // return router.replace("/(tabs)/complaints/(create)/camera");
    return router.back();
  }

  const handleConfirm = () => {
    clearDraft();
    router.replace("/(tabs)/complaints");
  };

  const handleBack = () => {
    if (captures.length === 0) {
      router.replace("/(tabs)/complaints/(create)/camera");
      return;
    }

    router.back();
  };

  const updateSelectedCapture = (
    payload: Partial<Pick<ComplaintCapture, "observation" | "type">>,
  ) => {
    updateCapture(selectedCapture.id, payload);
  };

  const handleDeleteCapture = (captureId: string) => {
    deleteCapture(captureId);
  };

  const captureDate = new Date(selectedCapture.date);
  const hasValidDate = !Number.isNaN(captureDate.getTime());
  const createdAtLabel = hasValidDate
    ? format(captureDate, "dd/MM/yyyy HH:mm:ss", { locale: ptBR })
    : selectedCapture.date;
  const dayOfWeekLabel = hasValidDate
    ? format(captureDate, "EEEE", { locale: ptBR })
    : "-";

  const latitude = selectedCapture.geospatial.location?.coords.latitude ?? null;
  const longitude =
    selectedCapture.geospatial.location?.coords.longitude ?? null;

  const latitudeFormatted =
    latitude != null
      ? formatSexagesimalCoordinate(latitude, "latitude")
      : "indisponivel";
  const longitudeFormatted =
    longitude != null
      ? formatSexagesimalCoordinate(longitude, "longitude")
      : "indisponivel";
  const altitudeFormatted = formatMeters(
    selectedCapture.geospatial.location?.coords.altitude,
  );
  const headingFormatted = formatHeading(
    selectedCapture.geospatial.heading?.magHeading,
    {
      includeCompass: true,
    },
  );

  const onConfirm = handleSubmit(handleConfirm);

  return (
    <KeyboardAvoidingView
      behavior={process.env.EXPO_OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <ScrollView
        className="flex-1 bg-white"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="gap-3 px-4 py-4 pb-8"
        keyboardShouldPersistTaps="handled"
      >
        <Card className="flex-row items-center gap-3 bg-gray-100 p-3 shadow-none">
          <View className="size-14 items-center justify-center rounded-lg bg-lime-800">
            <ShieldAlert size={24} color="#FFFFFF" strokeWidth={2.2} />
          </View>
          <View className="flex-1">
            <Heading size="md">Atenção</Heading>
            <Text className="text-sm text-gray-500">
              Por questões de segurança e consistência dos dados alguns dados
              não podem ser modificados.
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
            <Text>{createdAtLabel}</Text>
          </Card>
          <Card size="sm" className="flex-1 gap-1 p-2 shadow-none">
            <Text className="text-xs text-gray-500">Dia da semana</Text>
            <Text>{dayOfWeekLabel}</Text>
          </Card>
        </View>

        <View className="flex-row gap-2">
          <Card size="sm" className="flex-1 gap-1 p-2 shadow-none">
            <Text className="text-xs text-gray-500">Latitude</Text>
            <Text>{latitudeFormatted}</Text>
          </Card>
          <Card size="sm" className="flex-1 gap-1 p-2 shadow-none">
            <Text className="text-xs text-gray-500">Longitude</Text>
            <Text>{longitudeFormatted}</Text>
          </Card>
        </View>

        <View className="flex-row gap-2">
          <Card size="sm" className="flex-1 gap-1 p-2 shadow-none">
            <Text className="text-xs text-gray-500">Altura</Text>
            <Text>{altitudeFormatted}</Text>
          </Card>
          <Card size="sm" className="flex-1 gap-1 p-2 shadow-none">
            <Text className="text-xs text-gray-500">Bússola</Text>
            <Text>{headingFormatted}</Text>
          </Card>
        </View>

        <View className="gap-2">
          <Heading size="md">Endereço</Heading>
          <Card size="sm" className="p-2 shadow-none">
            <Text>{formatAddress(selectedCapture)}</Text>
          </Card>
        </View>

        <ComplaintMap
          latitude={latitude ?? -16.487742}
          longitude={longitude ?? -54.582445}
        />

        <FormControl isInvalid={!!errors.type} className="gap-2">
          <FormControlLabel>
            <FormControlLabelText>Tipo da denúncia</FormControlLabelText>
          </FormControlLabel>

          <Controller
            control={control}
            name="type"
            render={({ field: { value, onChange } }) => (
              <View className="flex-row flex-wrap gap-2">
                {complaintTypeValues.map(typeOption => {
                  const isSelected = value === typeOption.value;

                  return (
                    <Pressable
                      key={typeOption.value}
                      className={`rounded-md border px-3 py-2 ${
                        isSelected
                          ? "border-lime-800 bg-lime-800"
                          : "border-gray-200 bg-white"
                      }`}
                      onPress={() => {
                        onChange(typeOption.value as ComplaintType);
                        updateSelectedCapture({
                          type: typeOption.value as ComplaintType,
                        });
                      }}
                    >
                      <Text
                        className={isSelected ? "text-white" : "text-gray-700"}
                      >
                        {typeOption.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          />
          <Card className="shadow-none bg-lime-50 border-lime-800">
            <FormControlHelper>
              <FormControlHelperText>
                {
                  complaintTypeValues.find(
                    option => option.value === complaintTypeValue,
                  )?.description
                }
              </FormControlHelperText>
            </FormControlHelper>
          </Card>
          {errors.type?.message ? (
            <FormControlError>
              <FormControlErrorText>{errors.type.message}</FormControlErrorText>
            </FormControlError>
          ) : null}
        </FormControl>

        <FormControl isInvalid={!!errors.observation} className="gap-2">
          <FormControlLabel className="flex flex-col justify-start items-start">
            <FormControlLabelText>Observação</FormControlLabelText>
            <Text className="text-xs text-gray-500">
              Adicione observações sobre esta evidência que você está
              capturando.
            </Text>
          </FormControlLabel>

          <Controller
            control={control}
            name="observation"
            render={({ field: { value, onChange } }) => (
              <Input className="min-h-20">
                <InputField
                  multiline
                  textAlignVertical="top"
                  numberOfLines={4}
                  maxLength={500}
                  placeholder="Há um carro de placa HDX5487 fazendo descarte irregular frequente neste local."
                  value={value}
                  onChangeText={text => {
                    onChange(text);
                    updateSelectedCapture({ observation: text });
                  }}
                />
              </Input>
            )}
          />

          {errors.observation?.message ? (
            <FormControlError>
              <FormControlErrorText>
                {errors.observation.message}
              </FormControlErrorText>
            </FormControlError>
          ) : null}
        </FormControl>

        <View className="gap-2">
          <Heading size="md">Fotos e vídeos</Heading>
          <Text className="text-sm text-gray-500">
            Selecione uma mídia para conferir os dados e acrescentar observações
            ou mantenha pressionado para deletar.
          </Text>

          <ComplaintCaptureCarousel
            captures={captures}
            selectedCaptureId={selectedCaptureId}
            onSelectCapture={setSelectedCaptureId}
            onDeleteCapture={handleDeleteCapture}
          />
        </View>

        <View className="flex-row gap-3 pt-2">
          <Button variant="outline" className="flex-1" onPress={handleBack}>
            <ButtonText>Voltar</ButtonText>
          </Button>
          <Button className="flex-1 bg-lime-800" onPress={onConfirm}>
            <ButtonText className="text-white">Confirmar</ButtonText>
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
