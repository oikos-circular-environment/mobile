"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import * as Location from "expo-location";
import { useEffect, useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, ScrollView, View } from "react-native";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import {
  formatHeading,
  formatMeters,
  formatSexagesimalCoordinate,
  formatSpeed,
} from "@/libs/geospatial";

export default function GeoSpatialComponent() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [heading, setHeading] = useState<Location.LocationHeadingObject | null>(
    null,
  );
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [addressList, setAddressList] = useState<
    Location.LocationGeocodedAddress[]
  >([]);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isResolving, setIsResolving] = useState(true);
  const [reverseGeocodeError, setReverseGeocodeError] = useState(false);

  const lastReverseGeocodeAtRef = useRef<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    let headingSubscription: Location.LocationSubscription | null = null;
    let locationSubscription: Location.LocationSubscription | null = null;

    const shouldReverseGeocode = () => {
      const now = Date.now();

      if (now - lastReverseGeocodeAtRef.current < 15000) {
        return false;
      }

      lastReverseGeocodeAtRef.current = now;
      return true;
    };

    const startWatchers = async () => {
      try {
        setIsResolving(true);

        const currentPermission =
          await Location.getForegroundPermissionsAsync();
        let granted = currentPermission.status === "granted";

        if (!granted) {
          const requestedPermission =
            await Location.requestForegroundPermissionsAsync();
          granted = requestedPermission.status === "granted";
        }

        if (!granted) {
          if (isMounted) {
            setPermissionDenied(true);
          }
          return;
        }

        if (isMounted) {
          setPermissionDenied(false);
        }

        headingSubscription = await Location.watchHeadingAsync(nextHeading => {
          if (isMounted) {
            setHeading(nextHeading);
          }
        });

        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 2000,
            distanceInterval: 2,
            mayShowUserSettingsDialog: true,
          },
          async nextLocation => {
            if (!isMounted) {
              return;
            }

            setLocation(nextLocation);

            if (!shouldReverseGeocode()) {
              return;
            }

            try {
              const result = await Location.reverseGeocodeAsync({
                latitude: nextLocation.coords.latitude,
                longitude: nextLocation.coords.longitude,
              });

              if (isMounted) {
                setAddressList(result);
                setReverseGeocodeError(false);
              }
            } catch {
              if (isMounted) {
                setReverseGeocodeError(true);
              }
            }
          },
        );
      } catch {
        if (isMounted) {
          setPermissionDenied(true);
        }
      } finally {
        if (isMounted) {
          setIsResolving(false);
        }
      }
    };

    void startWatchers();

    return () => {
      isMounted = false;
      headingSubscription?.remove();
      locationSubscription?.remove();
    };
  }, []);

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

  return (
    <KeyboardAvoidingView
      behavior={process.env.EXPO_OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <ScrollView
        className="flex-1 bg-white"
        contentContainerClassName="p-4 pb-8"
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
      >
        <View className="gap-8">
          <Card>
            <Heading>Hora</Heading>

            <View>
              <Text>Data: {date}</Text>
              <Text>Hora: {time}</Text>
              <Text>Dia da Semana: {dayOfWeek}</Text>
            </View>
          </Card>

          <Card>
            <Heading>Localização</Heading>

            <View className="mt-2 flex-col gap-4">
              <View>
                <Text>Precisão da bússola: {heading?.accuracy}</Text>
                <Text>
                  Direção magnética:{" "}
                  {formatHeading(heading?.magHeading, {
                    includeCompass: true,
                  })}
                </Text>
                <Text>
                  Direção verdadeira:{" "}
                  {formatHeading(heading?.trueHeading, {
                    includeCompass: true,
                  })}
                </Text>
              </View>

              <View>
                <Text>
                  Precisão horizontal: {formatMeters(location?.coords.accuracy)}
                </Text>
                <Text>
                  Latitude:{" "}
                  {location?.coords.latitude != null
                    ? formatSexagesimalCoordinate(
                        location.coords.latitude,
                        "latitude",
                      )
                    : "indisponivel"}
                </Text>
                <Text>
                  Longitude:{" "}
                  {location?.coords.longitude != null
                    ? formatSexagesimalCoordinate(
                        location.coords.longitude,
                        "longitude",
                      )
                    : "indisponivel"}
                </Text>
                <Text>Altitude: {formatMeters(location?.coords.altitude)}</Text>
                <Text>
                  Precisão da altitude:{" "}
                  {formatMeters(location?.coords.altitudeAccuracy)}
                </Text>
                <Text>Direção: {formatHeading(location?.coords.heading)}</Text>
                <Text>Velocidade: {formatSpeed(location?.coords.speed)}</Text>
                <Text>
                  Última leitura:{" "}
                  {location?.timestamp
                    ? format(new Date(location.timestamp), "HH:mm:ss", {
                        locale: ptBR,
                      })
                    : "indisponivel"}
                </Text>
              </View>

              <View>
                <Text>Endereço:</Text>
                {addressList.length === 0 ? (
                  <Text className="mt-2 text-sm text-muted-foreground">
                    Aguardando atualização do endereço...
                  </Text>
                ) : null}
                {addressList.map((address, index) => (
                  <View key={index} className="mt-2">
                    <Text>Nome: {address.name}</Text>
                    <Text>Rua: {address.street}</Text>
                    <Text>Número: {address.streetNumber}</Text>
                    <Text>Bairro: {address.district}</Text>
                    <Text>Cidade: {address.city}</Text>
                    <Text>Região: {address.region}</Text>
                    <Text>CEP: {address.postalCode}</Text>
                    <Text>País: {address.country}</Text>
                    <Text>ISO País: {address.isoCountryCode}</Text>
                    <Text>Endereço formatado: {address.formattedAddress}</Text>
                  </View>
                ))}
              </View>

              {isResolving ? (
                <Text className="text-sm text-muted-foreground">
                  Obtendo dados em tempo real...
                </Text>
              ) : null}

              {permissionDenied ? (
                <Text className="text-sm text-destructive">
                  Permissão de localização negada. Ative a permissão para obter
                  dados em tempo real.
                </Text>
              ) : null}

              {reverseGeocodeError ? (
                <Text className="text-sm text-destructive">
                  Não foi possível atualizar o endereço nesta leitura.
                </Text>
              ) : null}
            </View>
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
