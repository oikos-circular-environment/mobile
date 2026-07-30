import { useRouter } from "expo-router";
import { LogOutIcon } from "lucide-react-native";
import { View } from "react-native";
import { colors } from "@/components/style/colors";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

export default function SurveyConsentEndedScreen() {
	const router = useRouter();

	return (
		<View className="flex-1 bg-white p-6 pb-8 justify-between">
			<View className="flex-1 items-center justify-center gap-4">
				<LogOutIcon size={48} color={colors.lime[700]} />

				<Heading size="2xl" className="text-center">
					Sua sessão foi encerrada
				</Heading>

				<Text className="text-center leading-6">
					Para participar, desconectamos a conta atual. A pesquisa começa do
					zero, como visitante. Você poderá voltar à sua conta normalmente ao
					final.
				</Text>
			</View>

			<Button onPress={() => router.replace("/survey/persona")}>
				<ButtonText>Continuar</ButtonText>
			</Button>
		</View>
	);
}
