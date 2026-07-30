import { useRouter } from "expo-router";
import {
	ClipboardListIcon,
	LogOutIcon,
	PauseCircleIcon,
	TimerIcon,
} from "lucide-react-native";
import type { ComponentType } from "react";
import { ScrollView, View } from "react-native";
import { colors } from "@/components/style/colors";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

function InfoRow({
	Icon,
	title,
	description,
}: {
	Icon: ComponentType<{ size: number; color: string }>;
	title: string;
	description: string;
}) {
	return (
		<View className="flex-row items-start gap-3">
			<View className="size-9 items-center justify-center rounded-full bg-lime-100">
				<Icon size={18} color={colors.lime[800]} />
			</View>
			<View className="flex-1 gap-0.5">
				<Text bold>{title}</Text>
				<Text size="sm" className="text-muted-foreground">
					{description}
				</Text>
			</View>
		</View>
	);
}

export default function SurveyPresentationScreen() {
	const router = useRouter();

	return (
		<ScrollView
			className="flex-1 bg-white"
			contentContainerClassName="p-6 pb-8 gap-8 flex-1"
		>
			<View className="gap-2">
				<Heading size="2xl">Pesquisa de usabilidade</Heading>
				<Text className="text-muted-foreground">
					Ajude a melhorar o Oikos participando de uma pesquisa curta,
					respondendo tarefas reais dentro do próprio app.
				</Text>
			</View>

			<View className="gap-5">
				<InfoRow
					Icon={ClipboardListIcon}
					title="Etapas curtas"
					description="Cada etapa leva poucos minutos e traz tarefas simples para você realizar."
				/>
				<InfoRow
					Icon={PauseCircleIcon}
					title="Pare e volte quando quiser"
					description="Dá para pausar a qualquer momento e retomar depois de onde parou."
				/>
				<InfoRow
					Icon={TimerIcon}
					title="Localização necessária"
					description="Boa parte das tarefas depende de encontrar o que está próximo de você."
				/>
				<InfoRow
					Icon={LogOutIcon}
					title="Encerra a sessão atual"
					description="Participar encerra a sessão da conta atual — a pesquisa começa do zero, como visitante."
				/>
			</View>

			<View className="flex-1" />

			<View className="gap-3">
				<Button onPress={() => router.push("/survey/location")}>
					<ButtonText>Continuar</ButtonText>
				</Button>
				<Button variant="outline" onPress={() => router.back()}>
					<ButtonText>Agora não</ButtonText>
				</Button>
			</View>
		</ScrollView>
	);
}
