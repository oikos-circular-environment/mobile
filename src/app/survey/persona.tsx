import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
	AppButton as Button,
	AppButtonText as ButtonText,
} from "@/components/app-button";
import { useSurveyProtocol } from "@/components/survey/hooks/use-survey-protocol";
import { OptionRowList } from "@/components/survey/option-row-list";
import { QHeader } from "@/components/survey/q-header";
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

	const items = (protocol?.personas ?? []).map(persona => ({
		key: persona.key,
		title: persona.label,
		description: persona.description,
		selected: selected === persona.key,
		onPress: () => setSelected(persona.key),
	}));

	return (
		<View
			className="flex-1 bg-white px-6 pb-6 gap-4"
			style={{ paddingTop: insets.top + 16 }}
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

			<OptionRowList data={items} isLoading={isLoading || !protocol} />

			<Button disabled={!selected} onPress={handleContinue}>
				<ButtonText>Continuar</ButtonText>
			</Button>
		</View>
	);
}
