import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import * as Location from "expo-location";
import { KeyboardAvoidingView, ScrollView, View } from "react-native";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

// Heading Updated: {"accuracy": 1, "magHeading": 33.76374435424805, "trueHeading": 14.356485366821289}

// Location Updated: {"coords": {"accuracy": 7.6362911885009215, "altitude": 235.5077483150772, "altitudeAccuracy": 30, "heading": -1, "latitude": -16.485559690169907, "longitude": -54.601839772724354, "speed": -1}, "timestamp": 1775568547085.4941}

export default async function ComplaintsScreen() {
  // Location.watchHeadingAsync(heading => {
  //   console.log("Heading Updated:", heading);
  // });

  // Location.watchPositionAsync(
  //   {
  //     accuracy: Location.Accuracy.High,
  //     timeInterval: 5000, // Update every 5 seconds
  //     distanceInterval: 10, // Update every 10 meters
  //   },
  //   location => {
  //     console.log("Location Updated:", location);
  //   },
  // );
  const heading = await Location.getHeadingAsync();
  console.log("Current Heading:", heading);

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  // console.log("Current Location:", location);

  const result = await Location.reverseGeocodeAsync({
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  });

  console.log("Reverse Geocode Result:", result);

  const currentDate = new Date();

  const date = format(currentDate, "dd/MM/yyyy", { locale: ptBR });
  const time = format(currentDate, "HH:mm", { locale: ptBR });
  const dayOfWeek = format(currentDate, "EEEE", { locale: ptBR });

  console.log(`Current Date: ${date}`);
  console.log(`Current Time: ${time}`);
  console.log(`Day of the Week: ${dayOfWeek}`);

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

            <View className="flex-col gap-2r">
              <View>
                <Text>Precisão: {heading.accuracy} graus</Text>
                <Text>Direção magnética: {heading.magHeading} graus</Text>
                <Text>Direção verdadeira: {heading.trueHeading} graus</Text>
              </View>

              <View>
                <Text>Precisão: {location.coords.accuracy} metros</Text>
                <Text>Latitude: {location.coords.latitude}</Text>
                <Text>Longitude: {location.coords.longitude}</Text>
                <Text>Precisão: {location.coords.accuracy} metros</Text>
                <Text>Altitude: {location.coords.altitude} metros</Text>
                <Text>Direção: {location.coords.heading} graus</Text>
                <Text>Velocidade: {location.coords.speed} m/s</Text>
              </View>

              <View>
                <Text>Endereço:</Text>
                {result.map((address, index) => (
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
                    <Text>Timezone: {address.timezone}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
