import { useRouter } from "expo-router";
import { LogOutIcon } from "lucide-react-native";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/components/style/colors";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

export default function SurveyConsentEndedScreen() {
	const insets = useSafeAreaInsets();
	const router = useRouter();

	return (
		<View
			className="flex-1 bg-white px-6 justify-between"
			style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }}
		>
			<View className="flex-1 items-center justify-center gap-4">
				<LogOutIcon size={48} color={colors.lime[700]} />

				<Heading size="2xl" className="text-center">
					Sua sessão foi encerrada
				</Heading>

				<Text className="text-center leading-6">
					Para participar, desconectamos a conta atual. O app faz login
					automático em uma conta de teste. Você poderá voltar à sua conta
					normalmente ao final.
				</Text>
			</View>

			<Button onPress={() => router.replace("/survey/persona")}>
				<ButtonText>Continuar</ButtonText>
			</Button>
		</View>
	);
}
