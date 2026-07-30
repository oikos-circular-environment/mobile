import { useRouter } from "expo-router";
import { MapPinIcon } from "lucide-react-native";
import { View } from "react-native";
import { colors } from "@/components/style/colors";
import { useSurveyLocationPermission } from "@/components/survey/hooks/use-survey-location-permission";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

export default function SurveyLocationScreen() {
	const router = useRouter();
	const { status, request } = useSurveyLocationPermission();

	const handleRequest = async () => {
		const granted = await request();

		if (granted) {
			router.replace("/survey/consent");
			return;
		}

		router.replace("/survey/location-denied");
	};

	return (
		<View className="flex-1 bg-white p-6 justify-between pb-8">
			<View className="flex-1 items-center justify-center gap-4">
				<View className="size-16 items-center justify-center rounded-full bg-lime-100">
					<MapPinIcon size={28} color={colors.lime[800]} />
				</View>
				<Heading size="xl" className="text-center">
					Precisamos da sua localização
				</Heading>
				<Text className="text-center text-muted-foreground">
					Boa parte das tarefas da pesquisa depende de encontrar o que está
					próximo de você. Sem localização não é possível participar.
				</Text>
			</View>

			<Button onPress={handleRequest} disabled={status === "requesting"}>
				{status === "requesting" ? <ButtonSpinner /> : null}
				<ButtonText>Permitir localização</ButtonText>
			</Button>
		</View>
	);
}
