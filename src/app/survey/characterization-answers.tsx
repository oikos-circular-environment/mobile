import { eq } from "drizzle-orm";
import { useRouter } from "expo-router";
import { ArrowLeftIcon } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { colors } from "@/components/style/colors";
import { useSurveyProtocol } from "@/components/survey/hooks/use-survey-protocol";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { getSurveyDb } from "@/libs/survey/db/client";
import { surveySession } from "@/libs/survey/db/schema";
import { useSurveyStore } from "@/stores/survey-store";

type SurveySessionRow = typeof surveySession.$inferSelect;

const SESSION_VALUE_BY_QUESTION_KEY: Record<
	string,
	(session: SurveySessionRow) => string | number
> = {
	state: session => session.stateUf,
	city: session => session.cityName,
	age_range: session => session.ageRange,
	education_level: session => session.educationLevel,
	chain_role: session => session.chainRole,
	waste_contact_frequency: session => session.wasteContactFrequency,
	app_experience: session => session.appExperience,
};

export default function SurveyCharacterizationAnswersScreen() {
	const router = useRouter();
	const { data: protocol } = useSurveyProtocol();
	const sessionId = useSurveyStore(s => s.sessionId);
	const [session, setSession] = useState<SurveySessionRow | null>(null);

	useEffect(() => {
		if (!sessionId) return;
		getSurveyDb()
			.select()
			.from(surveySession)
			.where(eq(surveySession.id, sessionId))
			.then(rows => setSession(rows[0] ?? null));
	}, [sessionId]);

	const screenerQuestions =
		protocol?.questions
			.filter(q => q.scope === "SCREENER")
			.sort((a, b) => a.position - b.position) ?? [];

	const personaLabel = protocol?.personas.find(
		p => p.key === session?.persona,
	)?.label;

	return (
		<View className="flex-1 bg-white px-6 pb-6 pt-14 gap-4">
			<View className="flex-row items-center gap-2.5">
				<Pressable onPress={() => router.back()} hitSlop={8}>
					<ArrowLeftIcon size={20} color={colors.gray[900]} />
				</Pressable>
				<Heading size="lg">Respostas · Caracterização</Heading>
			</View>

			<ScrollView contentContainerClassName="gap-2.5" className="flex-1">
				{session ? (
					<View className="gap-1.5 rounded-lg bg-gray-50 p-3.5">
						<Text size="sm" className="leading-5">
							Com qual persona você mais se identifica?
						</Text>
						<View className="self-start rounded-full bg-lime-100 px-2.5 py-1">
							<Text size="xs" bold className="text-lime-800">
								{personaLabel ?? session.persona}
							</Text>
						</View>
					</View>
				) : null}

				{session &&
					screenerQuestions.map(question => {
						const resolveValue = SESSION_VALUE_BY_QUESTION_KEY[question.key];
						if (!resolveValue) return null;
						const rawValue = resolveValue(session);
						const optionLabel = question.options?.find(
							o => o.key === rawValue || o.value === rawValue,
						)?.label;

						return (
							<View
								key={question.key}
								className="gap-1.5 rounded-lg bg-gray-50 p-3.5"
							>
								<Text size="sm" className="leading-5">
									{question.label}
								</Text>
								<View className="self-start rounded-full bg-lime-100 px-2.5 py-1">
									<Text size="xs" bold className="text-lime-800">
										{optionLabel ?? String(rawValue)}
									</Text>
								</View>
							</View>
						);
					})}
			</ScrollView>

			<Text size="xs" className="text-center text-muted-foreground">
				Essas respostas não podem ser editadas.
			</Text>
		</View>
	);
}
