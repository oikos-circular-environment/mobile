import { Link } from "expo-router";
import {
  ArrowRightIcon,
  BellIcon,
  CoinsIcon,
  SettingsIcon,
} from "lucide-react-native";
import { Image, Pressable, ScrollView, View } from "react-native";
import UserMockImage from "@/assets/images/mock/user-mock-image.png";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { createCompanies } from "@/libs/factories/create-companies";

export default function HomeScreen() {
  const marketCompanies = createCompanies(5);

  return (
    <ScrollView className="flex-1 p-4 bg-white">
      <View className="flex flex-col gap-4">
        <Card className="flex flex-row gap-4 shadow-none">
          <Link href="/(tabs)/(home)/profile" asChild>
            <Pressable className="flex flex-1 flex-row gap-4">
              <Image source={UserMockImage} className="size-16 rounded-md" />
              <View className="flex flex-col flex-1">
                <Heading numberOfLines={2}>
                  Christian Cesar Rodrigues Santos
                </Heading>
                <Text className="text-muted-foreground">Ver perfil</Text>
              </View>
            </Pressable>
          </Link>
          <View className="flex flex-row gap-2 items-start">
            <Button variant="secondary" size="icon">
              <BellIcon size={12} />
            </Button>
            <Link href="/(tabs)/(home)/settings" asChild>
              <Button variant="secondary" size="icon">
                <SettingsIcon size={12} />
              </Button>
            </Link>
          </View>
        </Card>

        <Card className="shadow-none gap-2">
          <Text>Coletas na sua região hoje</Text>
          <View className="flex flex-row gap-2">
            <Card className="flex flex-row gap-2 shadow-none px-2 p-1 items-center">
              <Text>A partir das 7h</Text>
              <Badge>
                <Text className="text-muted">Seletiva</Text>
              </Badge>
            </Card>
          </View>
        </Card>
        <View className="flex flex-col gap-4">
          <Heading>Mercado</Heading>
          {marketCompanies.map(company => (
            <Card
              key={company.id}
              className="flex flex-row gap-4 shadow-none items-center justify-between"
            >
              <View className="flex flex-row flex-1 gap-4 justify-between">
                <Card className="size-12 rounded-md bg-gray-50 flex items-center justify-center">
                  <CoinsIcon />
                </Card>

                <View className="flex flex-col flex-1">
                  <Heading numberOfLines={1}>{company.corporateName}</Heading>
                  <Text numberOfLines={2}>
                    {company.address?.street}, {company.address?.number},{" "}
                    {company.address?.district}
                  </Text>
                </View>
              </View>

              <View>
                <ArrowRightIcon />
              </View>
            </Card>
          ))}
        </View>

        <View className="flex flex-col gap-4">
          <Heading>Aprender</Heading>
          <Card className="flex flex-col gap-2 shadow-none size-60">
            <Image
              src="https://plus.unsplash.com/premium_vector-1711877749643-73289b60330e?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              className="h-28 w-full rounded-md object-cover"
            />
            <View>
              <Heading>Como separar seu lixo?</Heading>
              <Text numberOfLines={3}>
                Aprenda a separar seu lixo corretamente e contribuir para um
                mundo mais sustentável.
              </Text>
            </View>
          </Card>
        </View>
      </View>
    </ScrollView>
  );
}
