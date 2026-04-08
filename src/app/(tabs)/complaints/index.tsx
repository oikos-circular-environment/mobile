"use client";

import { router } from "expo-router";
import { Plus, ShieldIcon } from "lucide-react-native";
import { ScrollView, View } from "react-native";
import { ComplaintCard } from "@/components/complaints/complaint-card";
import { ComplaintPainel } from "@/components/complaints/complaint-painel";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import type { Complaint } from "@/libs/types/complaint";

const complaintPainelValues = {
  total: 10,
  resolved: 4,
  pending: 5,
  canceled: 1,
};

const complaint: Complaint[] = [
  {
    address:
      "Rua A 144, QD 485, LT 50, São Cristovão, Rondonópolis - MT, 78700-000",
    dateTime: "14/06/2025 11:50:26 - Sábado",
    coordinates: {
      latitude: 16.836111,
      longitude: -80.502778,
      formatted: "16° 50' 10\" S, 80° 30' 10\" W",
    },
    status: "pending",
  },
];

export default function ComplaintsScreen() {
  return (
    <ScrollView
      className="flex-1 bg-white"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-4 px-4 py-4 pb-8"
    >
      <Card className=" bg-gray-100 p-4 shadow-none">
        <View className="flex-row items-center gap-4">
          <View className="flex-1 gap-1">
            <Heading>Denunciar</Heading>
            <Text className="text-sm text-gray-500" selectable>
              Faça a sua denúncia anônima e gratuita. Ajude a manter o meio
              ambiente livre do descarte irregular.
            </Text>
          </View>

          <View className="size-14 items-center justify-center rounded-lg bg-lime-800">
            <ShieldIcon size={24} color="#FFFFFF" strokeWidth={2.25} />
          </View>
        </View>
      </Card>

      <Button
        size="lg"
        onPress={() => router.push("/complaints/camera" as never)}
      >
        <ButtonText className="flex-1 text-center font-semibold text-white">
          Nova Denúncia
        </ButtonText>
        <ButtonIcon as={Plus} className="text-white" height={18} width={18} />
      </Button>

      <View className="justify-center">
        <Heading>Painel de Denúncias</Heading>
      </View>

      <ComplaintPainel panel={complaintPainelValues} />

      <View>
        <Heading>Denúncias</Heading>
      </View>

      <View className="gap-4">
        {complaint.map((item, index) => (
          <ComplaintCard key={index} complaint={item} />
        ))}
      </View>
    </ScrollView>
  );
}
