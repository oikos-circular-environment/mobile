import { useRouter } from "expo-router";
import { LocateOffIcon } from "lucide-react-native";
import { Linking, View } from "react-native";
import { colors } from "@/components/style/colors";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

export default function SurveyLocationDeniedScreen() {
	const router = useRouter();

	return (
		<View className="flex-1 bg-white p-6 justify-between pb-8">
			<View className="flex-1 items-center justify-center gap-4">
				<View className="size-16 items-center justify-center rounded-full bg-red-50">
					<LocateOffIcon size={28} color={colors.red[500]} />
				</View>
				<Heading size="xl" className="text-center">
					Não é possível participar
				</Heading>
				<Text className="text-center text-muted-foreground">
					Sem acesso à localização não dá para completar as tarefas da pesquisa.
					Nada foi registrado — você pode habilitar a localização nas
					configurações do aparelho e tentar de novo quando quiser.
				</Text>
			</View>

			<View className="gap-3">
				<Button onPress={() => Linking.openSettings()}>
					<ButtonText>Abrir configurações</ButtonText>
				</Button>
				<Button
					variant="outline"
					onPress={() => router.replace("/(tabs)/(home)")}
				>
					<ButtonText>Voltar</ButtonText>
				</Button>
			</View>
		</View>
	);
}
