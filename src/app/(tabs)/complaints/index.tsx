"use client";

import { router } from "expo-router";
import {
  EllipsisVertical,
  Plus,
  Shield,
  ShieldCheck,
  ShieldQuestionMark,
  ShieldX,
} from "lucide-react-native";
import { ScrollView, View } from "react-native";
import { ComplaintMap } from "@/components/complaints/complaint-map";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";

const stats = [
  {
    label: "Total de denúncias",
    value: "10",
    icon: Shield,
    iconClassName: "bg-sky-100 text-sky-500",
  },
  {
    label: "Denúncias resolvidas",
    value: "5",
    icon: ShieldCheck,
    iconClassName: "bg-lime-100 text-lime-800",
  },
  {
    label: "Denúncias pendentes",
    value: "3",
    icon: ShieldQuestionMark,
    iconClassName: "bg-amber-100 text-amber-500",
  },
  {
    label: "Denúncias canceladas",
    value: "2",
    icon: ShieldX,
    iconClassName: "bg-red-100 text-red-500",
  },
] as const;

const statRows = [stats.slice(0, 2), stats.slice(2, 4)];

const reportItem = {
  address:
    "Rua A 144, QD 485, LT 50, São Cristovão, Rondonópolis - MT, 78700-000",
  dateTime: "14/06/2025 11:50:26 - Sábado",
  coordinates: {
    latitude: 16.836111,
    longitude: -80.502778,
    formatted: "16° 50' 10\" S, 80° 30' 10\" W",
  },
  latitude: -16.487742,
  longitude: -54.582445,
  status: "pending", // "resolved", "canceled"
};

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
            <Shield size={24} color="#FFFFFF" strokeWidth={2.25} />
          </View>
        </View>
      </Card>

      <Button size="lg" onPress={() => router.push("/camera" as never)}>
        <ButtonText className="flex-1 text-center font-semibold text-white">
          Nova Denúncia
        </ButtonText>
        <ButtonIcon as={Plus} className="text-white" height={18} width={18} />
      </Button>

      <View className="justify-center">
        <Heading>Painel de Denúncias</Heading>
      </View>

      <View className="gap-2">
        {statRows.map((row, rowIndex) => (
          <View key={`stat-row-${rowIndex}`} className="flex-row gap-2">
            {row.map(stat => {
              const Icon = stat.icon;

              return (
                <Card
                  key={stat.label}
                  size="sm"
                  className="flex-1 gap-2 rounded-md border border-gray-200 bg-white p-2 shadow-none"
                >
                  <View className="flex-row items-center justify-between">
                    <Heading>{stat.value}</Heading>

                    <View
                      className={`size-5 items-center justify-center rounded-md ${stat.iconClassName}`}
                    >
                      <Icon size={12} strokeWidth={2.5} />
                    </View>
                  </View>

                  <Text className="text-sm text-gray-500" selectable>
                    {stat.label}
                  </Text>
                </Card>
              );
            })}
          </View>
        ))}
      </View>

      <View>
        <Heading>Denúncias</Heading>
      </View>

      <Card
        size="sm"
        className="gap-3 rounded-md border border-gray-100 bg-white p-3 shadow-none"
      >
        <View className="gap-2">
          <View className="flex-row items-center gap-2">
            <View className="flex-1 justify-center">
              <Heading numberOfLines={1}>{reportItem.address}</Heading>
              <Text className="text-sm text-gray-500" selectable>
                {reportItem.dateTime}
              </Text>
              <Text className="text-sm text-gray-500" selectable>
                {reportItem.coordinates.formatted}
              </Text>
            </View>

            <View className="items-center gap-2 rounded-md bg-gray-100 p-1">
              <View className="size-5 items-center justify-center rounded-md bg-lime-100">
                <ShieldCheck size={12} strokeWidth={2.5} color="#3F6212" />
              </View>

              <Pressable className="size-5 items-center justify-center">
                <EllipsisVertical size={12} color="#030712" strokeWidth={2.2} />
              </Pressable>
            </View>
          </View>

          <ComplaintMap
            latitude={reportItem.latitude}
            longitude={reportItem.longitude}
          />
        </View>
      </Card>
    </ScrollView>
  );
}
