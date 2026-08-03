import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { useAuthContext } from "@/contexts/auth-context";
import {
	CONSENT_IDENTIFICATION,
	CONSENT_SECTIONS,
	CONSENT_TERM_VERSION,
} from "@/libs/survey/consent-content";
import { useSurveyStore } from "@/stores/survey-store";

const SCROLL_END_THRESHOLD_PX = 24;

function IdentificationRow({ label, value }: { label: string; value: string }) {
	return (
		<View className="gap-0.5">
			<Text
				size="xs"
				bold
				className="uppercase tracking-wide text-muted-foreground"
			>
				{label}
			</Text>
			<Text size="sm" bold>
				{value}
			</Text>
		</View>
	);
}

export default function SurveyConsentScreen() {
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const { isAuthenticated, signOut } = useAuthContext();
	const setConsent = useSurveyStore(s => s.setConsent);
	const [reachedEnd, setReachedEnd] = useState(false);

	const handleScroll = useCallback(
		(event: NativeSyntheticEvent<NativeScrollEvent>) => {
			if (reachedEnd) return;

			const { layoutMeasurement, contentOffset, contentSize } =
				event.nativeEvent;
			const distanceToEnd =
				contentSize.height - (layoutMeasurement.height + contentOffset.y);

			if (distanceToEnd <= SCROLL_END_THRESHOLD_PX) {
				setReachedEnd(true);
			}
		},
		[reachedEnd],
	);

	const handleAccept = () => {
		setConsent(CONSENT_TERM_VERSION, new Date().toISOString());

		if (isAuthenticated) {
			signOut();
			router.replace("/survey/consent-ended");
		} else {
			router.replace("/survey/persona");
		}
	};

	const handleRefuse = () => {
		router.replace("/(tabs)/(home)");
	};

	return (
		<View className="flex-1 bg-white">
			<ScrollView
				testID="survey-consent-scroll"
				className="flex-1"
				onScroll={handleScroll}
				scrollEventThrottle={100}
				contentContainerStyle={{
					paddingTop: insets.top + 56,
					gap: 16,
					paddingHorizontal: 24,
					paddingBottom: 32,
				}}
			>
				<Heading size="xl">Termo de consentimento</Heading>

				<View className="gap-3 rounded-lg bg-gray-50 p-4">
					<IdentificationRow
						label="Título da pesquisa"
						value={CONSENT_IDENTIFICATION.researchTitle}
					/>
					<IdentificationRow
						label="Instituição / Programa"
						value={CONSENT_IDENTIFICATION.institution}
					/>
					<IdentificationRow
						label="Pesquisador responsável"
						value={CONSENT_IDENTIFICATION.researcher}
					/>
					<IdentificationRow
						label="Nº do parecer CEP"
						value={CONSENT_IDENTIFICATION.cepStatus}
					/>
				</View>

				{CONSENT_SECTIONS.map(section => (
					<View key={section.heading} className="gap-1.5">
						<Text bold>{section.heading}</Text>
						{section.paragraphs.map(paragraph => (
							<Text key={paragraph} size="sm" className="leading-5">
								{paragraph}
							</Text>
						))}
					</View>
				))}

				<View className="gap-2 pt-2">
					<Button disabled={!reachedEnd} onPress={handleAccept}>
						<ButtonText>Li e aceito</ButtonText>
					</Button>
					{!reachedEnd ? (
						<Text size="xs" className="text-center text-muted-foreground">
							O botão destrava ao chegar ao fim do texto
						</Text>
					) : null}
					<Button variant="outline" onPress={handleRefuse}>
						<ButtonText>Recusar</ButtonText>
					</Button>
				</View>
			</ScrollView>
		</View>
	);
}
