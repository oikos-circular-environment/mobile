import { useRouter } from "expo-router";
import { ClipboardListIcon, TriangleAlertIcon } from "lucide-react-native";
import { View } from "react-native";
import { colors } from "@/components/style/colors";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { useGeospatial } from "@/contexts/geospatial-context";

export default function SurveyPresentationScreen() {
	const router = useRouter();
	const { permissionDenied } = useGeospatial();

	const handleContinue = () => {
		if (permissionDenied) {
			router.push("/survey/location-denied");
			return;
		}

		router.push("/survey/consent");
	};

	return (
		<View className="flex-1 bg-white p-6 pb-8 justify-between">
			<View className="flex-1 items-center justify-center gap-4">
				<ClipboardListIcon size={48} color={colors.lime[700]} />

				<Heading size="2xl" className="text-center">
					Pesquisa de usabilidade
				</Heading>

				<Text className="text-center leading-6">
					Você vai usar o Oikos normalmente enquanto realizamos algumas tarefas
					guiadas. Cada etapa leva de 5 a 10 minutos, e você pode pausar e
					retomar quando quiser.
				</Text>

				<View className="w-full flex-row items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
					<TriangleAlertIcon size={18} color={colors.yellow[800]} />
					<Text size="sm" className="flex-1 leading-5 text-yellow-800">
						Participar encerra a sessão da conta atual. A pesquisa começa como
						visitante.
					</Text>
				</View>
			</View>

			<View className="gap-3">
				<Button onPress={handleContinue}>
					<ButtonText>Continuar</ButtonText>
				</Button>
				<Button variant="outline" onPress={() => router.back()}>
					<ButtonText>Agora não</ButtonText>
				</Button>
			</View>
		</View>
	);
}
