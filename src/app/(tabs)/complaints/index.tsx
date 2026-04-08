"use client";

import * as Linking from "expo-linking";
import { router } from "expo-router";
import {
  EllipsisVertical,
  EyeIcon,
  MapPinned,
  Plus,
  ShieldCheck,
  ShieldCheckIcon,
  ShieldIcon,
  ShieldXIcon,
} from "lucide-react-native";
import { Alert, Platform, ScrollView, View } from "react-native";
import { ComplaintMap } from "@/components/complaints/complaint-map";
import { ComplaintPainel } from "@/components/complaints/complaint-painel";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import {
  Menu,
  MenuItem,
  MenuItemLabel,
  MenuSeparator,
} from "@/components/ui/menu";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";

const complaintPainelValues = {
  total: 10,
  resolved: 4,
  pending: 5,
  canceled: 1,
};

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
  const handleViewComplaint = () => {
    Alert.alert("Denúncia", "Abrindo detalhes da denúncia.");
  };

  const handleMarkResolved = () => {
    Alert.alert("Denúncia", "Denúncia marcada como resolvida.");
  };

  const handleCancelComplaint = () => {
    Alert.alert("Denúncia", "Denúncia cancelada.");
  };

  const handleOpenInMaps = async () => {
    const { latitude, longitude } = reportItem;
    const mapsUrl =
      Platform.OS === "ios"
        ? `http://maps.apple.com/?ll=${latitude},${longitude}`
        : `geo:${latitude},${longitude}?q=${latitude},${longitude}`;

    const fallbackUrl =
      `https://www.google.com/maps/search/?api=1&query=` +
      `${latitude},${longitude}`;

    try {
      const canOpenNative = await Linking.canOpenURL(mapsUrl);

      if (canOpenNative) {
        await Linking.openURL(mapsUrl);
        return;
      }

      await Linking.openURL(fallbackUrl);
    } catch {
      Alert.alert("Maps", "Não foi possível abrir o aplicativo de mapas.");
    }
  };

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

              <Menu
                placement="bottom right"
                offset={8}
                trigger={triggerProps => {
                  return (
                    <Pressable
                      className="size-5 items-center justify-center"
                      {...triggerProps}
                    >
                      <EllipsisVertical
                        size={12}
                        color="#030712"
                        strokeWidth={2.2}
                      />
                    </Pressable>
                  );
                }}
              >
                <MenuItem
                  key="view-complaint"
                  textValue="Ver denúncia"
                  onPress={handleViewComplaint}
                >
                  <View className="flex-row items-center gap-2">
                    <EyeIcon size={14} strokeWidth={2.2} />
                    <MenuItemLabel>Ver denúncia</MenuItemLabel>
                  </View>
                </MenuItem>

                <MenuItem
                  key="mark-resolved"
                  textValue="Marcar como resolvida"
                  onPress={handleMarkResolved}
                >
                  <View className="flex-row items-center gap-2">
                    <ShieldCheckIcon
                      size={14}
                      color="#3F6212"
                      strokeWidth={2.2}
                    />
                    <MenuItemLabel>Marcar como resolvida</MenuItemLabel>
                  </View>
                </MenuItem>

                <MenuItem
                  key="cancel-complaint"
                  textValue="Cancelar denúncia"
                  onPress={handleCancelComplaint}
                >
                  <View className="flex-row items-center gap-2">
                    <ShieldXIcon size={14} color="#B91C1C" strokeWidth={2.2} />
                    <MenuItemLabel>Cancelar denúncia</MenuItemLabel>
                  </View>
                </MenuItem>

                <MenuSeparator />

                <MenuItem
                  key="open-maps"
                  textValue="Abrir no maps"
                  onPress={handleOpenInMaps}
                >
                  <View className="flex-row items-center gap-2">
                    <MapPinned size={14} strokeWidth={2.2} />
                    <MenuItemLabel>Abrir no mapa</MenuItemLabel>
                  </View>
                </MenuItem>
              </Menu>
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
