import { useRouter } from "expo-router";
import { View } from "react-native";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

export default function SurveyConsentPlaceholderScreen() {
	const router = useRouter();

	return (
		<View className="flex-1 bg-white p-6 items-center justify-center gap-4">
			<Heading size="xl" className="text-center">
				Consentimento
			</Heading>
			<Text className="text-center text-muted-foreground">
				Localização concedida. O termo de consentimento (M03) ainda não foi
				implementado.
			</Text>
			<Button onPress={() => router.replace("/(tabs)/(home)")}>
				<ButtonText>Voltar para a home</ButtonText>
			</Button>
		</View>
	);
}
