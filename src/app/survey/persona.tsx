import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSurveyProtocol } from "@/components/survey/hooks/use-survey-protocol";
import { OptionRow } from "@/components/survey/option-row";
import { QHeader } from "@/components/survey/q-header";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { useSurveyDraftStore } from "@/stores/survey-draft-store";

export default function SurveyPersonaScreen() {
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const { data: protocol, isLoading } = useSurveyProtocol();
	const draftPersona = useSurveyDraftStore(s => s.persona);
	const setPersona = useSurveyDraftStore(s => s.setPersona);
	const [selected, setSelected] = useState<string | null>(draftPersona);

	const totalSteps = useMemo(() => {
		const screenerCount =
			protocol?.questions.filter(q => q.scope === "SCREENER").length ?? 0;
		return screenerCount + 1;
	}, [protocol]);

	const handleContinue = () => {
		if (!selected) return;
		setPersona(selected);
		router.push("/survey/characterization");
	};

	return (
		<View
			className="flex-1 bg-white px-6 pb-6 gap-4"
			style={{ paddingTop: insets.top + 56 }}
		>
			<QHeader
				categoryLabel="Caracterização"
				currentIndex={1}
				totalCount={totalSteps}
			/>

			<View className="gap-1">
				<Heading size="xl">Com qual persona você mais se identifica?</Heading>
				<Text size="sm" className="text-muted-foreground">
					Isso define quais etapas você vai realizar.
				</Text>
			</View>

			<ScrollView contentContainerClassName="gap-2.5" className="flex-1">
				{isLoading || !protocol
					? null
					: protocol.personas.map(persona => (
							<OptionRow
								key={persona.key}
								title={persona.label}
								description={persona.description}
								selected={selected === persona.key}
								onPress={() => setSelected(persona.key)}
							/>
						))}
			</ScrollView>

			<Button disabled={!selected} onPress={handleContinue}>
				<ButtonText>Continuar</ButtonText>
			</Button>
		</View>
	);
}
