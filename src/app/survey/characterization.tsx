import { useRouter } from "expo-router";
import { ArrowLeftIcon, SearchIcon } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { BackHandler, Pressable, ScrollView, View } from "react-native";
import { colors } from "@/components/style/colors";
import {
	useSurveyCities,
	useSurveyStates,
} from "@/components/survey/hooks/use-survey-location-catalog";
import { useSurveyProtocol } from "@/components/survey/hooks/use-survey-protocol";
import { OptionRow } from "@/components/survey/option-row";
import { QHeader } from "@/components/survey/q-header";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { createSurveySession } from "@/libs/survey/create-session";
import { useSurveyDraftStore } from "@/stores/survey-draft-store";
import { useSurveyStore } from "@/stores/survey-store";

const DRAFT_KEY_BY_QUESTION: Record<
	string,
	"stateUf" | "cityName" | "ageRange" | "educationLevel" | "chainRole"
> = {
	state: "stateUf",
	city: "cityName",
	age_range: "ageRange",
	education_level: "educationLevel",
	chain_role: "chainRole",
};

function CatalogEmptyMessage() {
	return (
		<Text size="sm" className="text-muted-foreground">
			Não foi possível carregar a lista agora. Verifique sua conexão e tente
			novamente.
		</Text>
	);
}

export default function SurveyCharacterizationScreen() {
	const router = useRouter();
	const { data: protocol } = useSurveyProtocol();
	const draft = useSurveyDraftStore();
	const startSession = useSurveyStore(s => s.startSession);
	const [stepIndex, setStepIndex] = useState(0);
	const [search, setSearch] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const stepIndexRef = useRef(stepIndex);
	useEffect(() => {
		stepIndexRef.current = stepIndex;
	}, [stepIndex]);

	const goToPreviousStep = () => {
		if (stepIndexRef.current > 0) {
			setStepIndex(current => current - 1);
			setSearch("");
			return;
		}
		router.back();
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: assina uma única vez — lê stepIndex sempre atual via ref, não precisa recriar a assinatura
	useEffect(() => {
		const subscription = BackHandler.addEventListener(
			"hardwareBackPress",
			() => {
				goToPreviousStep();
				return true;
			},
		);
		return () => subscription.remove();
	}, []);

	const screenerQuestions = useMemo(
		() =>
			(protocol?.questions ?? [])
				.filter(q => q.scope === "SCREENER")
				.sort((a, b) => a.position - b.position),
		[protocol],
	);

	const question = screenerQuestions[stepIndex];
	const totalCount = screenerQuestions.length + 1;

	const { data: states, isLoading: isLoadingStates } = useSurveyStates();
	const { data: cities, isLoading: isLoadingCities } = useSurveyCities(
		draft.stateUf,
	);

	if (!protocol || !question) {
		return <View className="flex-1 bg-white" />;
	}

	const isStateQuestion = question.key === "state";
	const isCityQuestion = question.key === "city";
	const isCatalogQuestion = isStateQuestion || isCityQuestion;

	const currentAnswerKey = DRAFT_KEY_BY_QUESTION[question.key];
	const currentValue = currentAnswerKey ? draft[currentAnswerKey] : null;
	const isNumberQuestion =
		question.key === "waste_contact_frequency" ||
		question.key === "app_experience";
	const currentNumberValue =
		question.key === "waste_contact_frequency"
			? draft.wasteContactFrequency
			: question.key === "app_experience"
				? draft.appExperience
				: null;

	const canContinue = isNumberQuestion
		? currentNumberValue !== null
		: Boolean(currentValue);

	const searchTerm = search.trim().toLowerCase();

	const goToNextStep = async () => {
		if (stepIndex < screenerQuestions.length - 1) {
			setStepIndex(current => current + 1);
			setSearch("");
			return;
		}

		if (
			!draft.persona ||
			!draft.stateUf ||
			!draft.cityName ||
			!draft.ageRange ||
			!draft.educationLevel ||
			!draft.chainRole ||
			draft.wasteContactFrequency === null ||
			draft.appExperience === null
		) {
			return;
		}

		setIsSubmitting(true);
		try {
			const sessionId = await createSurveySession({
				protocolKey: protocol.key,
				protocolVersion: protocol.version,
				persona: draft.persona,
				stateUf: draft.stateUf,
				cityName: draft.cityName,
				ageRange: draft.ageRange,
				educationLevel: draft.educationLevel,
				chainRole: draft.chainRole,
				wasteContactFrequency: draft.wasteContactFrequency,
				appExperience: draft.appExperience,
				consentVersion: useSurveyStore.getState().consentVersion ?? "",
				consentAt: useSurveyStore.getState().consentAt ?? "",
			});
			startSession(sessionId, draft.persona);
			useSurveyDraftStore.getState().reset();
			router.replace("/survey/suite-intro");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<View className="flex-1 bg-white px-6 pb-6 pt-14 gap-4">
			<View className="flex-row items-center gap-2.5">
				<Pressable
					onPress={goToPreviousStep}
					hitSlop={8}
					accessibilityLabel="Voltar"
				>
					<ArrowLeftIcon size={20} color={colors.gray[900]} />
				</Pressable>
				<QHeader
					categoryLabel="Caracterização"
					currentIndex={stepIndex + 2}
					totalCount={totalCount}
					className="flex-1"
				/>
			</View>

			<View className="gap-1">
				<Heading size="xl">{question.label}</Heading>
				{question.helper_text ? (
					<Text size="sm" className="text-muted-foreground">
						{question.helper_text}
					</Text>
				) : null}
			</View>

			{isCatalogQuestion ? (
				<Input>
					<InputSlot className="pl-3">
						<InputIcon as={SearchIcon} />
					</InputSlot>
					<InputField
						placeholder={isStateQuestion ? "Buscar estado" : "Buscar cidade"}
						value={search}
						onChangeText={setSearch}
					/>
				</Input>
			) : null}

			<ScrollView contentContainerClassName="gap-2.5" className="flex-1">
				{isStateQuestion ? (
					isLoadingStates ? null : !states || states.length === 0 ? (
						<CatalogEmptyMessage />
					) : (
						states
							.filter(state => state.nome.toLowerCase().includes(searchTerm))
							.map(state => (
								<OptionRow
									key={state.sigla}
									title={state.nome}
									selected={draft.stateUf === state.sigla}
									onPress={() => {
										useSurveyDraftStore
											.getState()
											.setScreenerAnswer("stateUf", state.sigla);
										useSurveyDraftStore
											.getState()
											.setScreenerAnswer("cityName", null);
									}}
								/>
							))
					)
				) : isCityQuestion ? (
					isLoadingCities ? null : !cities || cities.length === 0 ? (
						<CatalogEmptyMessage />
					) : (
						cities
							.filter(city => city.nome.toLowerCase().includes(searchTerm))
							.map(city => (
								<OptionRow
									key={city.codigo_ibge}
									title={city.nome}
									selected={draft.cityName === city.nome}
									onPress={() =>
										useSurveyDraftStore
											.getState()
											.setScreenerAnswer("cityName", city.nome)
									}
								/>
							))
					)
				) : (
					question.options?.map(option => (
						<OptionRow
							key={option.key}
							title={option.label}
							selected={
								isNumberQuestion
									? currentNumberValue === option.value
									: currentValue === option.key
							}
							onPress={() => {
								if (question.key === "waste_contact_frequency") {
									useSurveyDraftStore
										.getState()
										.setScreenerAnswer("wasteContactFrequency", option.value);
								} else if (question.key === "app_experience") {
									useSurveyDraftStore
										.getState()
										.setScreenerAnswer("appExperience", option.value);
								} else if (currentAnswerKey) {
									useSurveyDraftStore
										.getState()
										.setScreenerAnswer(currentAnswerKey, option.key);
								}
							}}
						/>
					))
				)}
			</ScrollView>

			<Button disabled={!canContinue || isSubmitting} onPress={goToNextStep}>
				{isSubmitting ? <ButtonSpinner /> : null}
				<ButtonText>Continuar</ButtonText>
			</Button>
		</View>
	);
}
