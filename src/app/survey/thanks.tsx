import { eq } from "drizzle-orm";
import { useRouter } from "expo-router";
import { PartyPopperIcon } from "lucide-react-native";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { colors } from "@/components/style/colors";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { getSurveyDb } from "@/libs/survey/db/client";
import { surveySession } from "@/libs/survey/db/schema";
import { useSurveyDraftStore } from "@/stores/survey-draft-store";
import { useSurveyExecutionStore } from "@/stores/survey-execution-store";
import { useSurveyStore } from "@/stores/survey-store";

export default function SurveyThanksScreen() {
	const router = useRouter();
	const sessionId = useSurveyStore(s => s.sessionId);
	const [participantCode, setParticipantCode] = useState<string | null>(null);

	useEffect(() => {
		if (!sessionId) return;
		getSurveyDb()
			.select()
			.from(surveySession)
			.where(eq(surveySession.id, sessionId))
			.then(rows => setParticipantCode(rows[0]?.participantCode ?? null));
	}, [sessionId]);

	const handleBackToAccount = () => {
		useSurveyExecutionStore.getState().reset();
		useSurveyDraftStore.getState().reset();
		router.dismissTo("/(tabs)/(home)" as never);
	};

	return (
		<View className="flex-1 bg-white px-6 pb-8 pt-20 gap-5">
			<View className="flex-1 items-center justify-center gap-5">
				<PartyPopperIcon size={52} color={colors.lime[700]} />

				<Heading size="2xl" className="text-center">
					Muito obrigado por participar!
				</Heading>

				<View className="w-full items-center gap-2 rounded-lg bg-gray-50 p-5">
					<Text
						size="xs"
						bold
						className="uppercase tracking-wider text-muted-foreground"
					>
						Seu código de participante
					</Text>
					{participantCode ? (
						<Text size="xl" bold selectable>
							{participantCode}
						</Text>
					) : (
						<Text size="sm" className="text-muted-foreground">
							Seu código aparece aqui assim que houver conexão.
						</Text>
					)}
					{participantCode ? (
						<Text size="xs" className="text-muted-foreground">
							Toque e segure para copiar
						</Text>
					) : null}
				</View>

				<Text className="text-center leading-5" size="sm">
					Guarde este código: é ele que permite pedir a exclusão dos seus dados
					a qualquer momento.
				</Text>
				<Text className="text-center leading-5" size="sm">
					A conta que você usava antes continua ativa. Você pode voltar a ela
					normalmente.
				</Text>
			</View>

			<Button onPress={handleBackToAccount}>
				<ButtonText>Voltar para minha conta</ButtonText>
			</Button>
		</View>
	);
}
