import * as Crypto from "expo-crypto";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Keyboard, KeyboardAvoidingView, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QHeader } from "@/components/survey/q-header";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { getSurveyDb } from "@/libs/survey/db/client";
import { surveyAnswer } from "@/libs/survey/db/schema";
import { drainOutbox, enqueueFinish } from "@/libs/survey/queue/outbox";
import { sessionTotals } from "@/libs/survey/session-totals";
import { useSurveyStore } from "@/stores/survey-store";

const MAX_LENGTH = 4000;

export default function SurveyClosingCommentScreen() {
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const sessionId = useSurveyStore(s => s.sessionId);
	const setStatus = useSurveyStore(s => s.setStatus);
	const [comment, setComment] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async () => {
		if (!sessionId) return;

		setIsSubmitting(true);
		try {
			const now = new Date().toISOString();
			const trimmed = comment.trim();
			const db = getSurveyDb();

			if (trimmed) {
				await db.insert(surveyAnswer).values({
					id: Crypto.randomUUID(),
					sessionId,
					suiteRunId: null,
					questionKey: "free_comment",
					valueText: trimmed,
				});
			}

			const { activeMs, wallMs } = await sessionTotals(sessionId, now);

			await enqueueFinish(sessionId, {
				session_id: sessionId,
				active_ms: activeMs,
				wall_ms: wallMs,
				finished_at: now,
				answers: trimmed
					? [{ question_key: "free_comment", value_text: trimmed }]
					: [],
			});

			await drainOutbox(sessionId);

			setStatus("COMPLETED");
			router.replace("/survey/thanks");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<KeyboardAvoidingView behavior="padding" className="flex-1 bg-white">
			<Pressable
				onPress={Keyboard.dismiss}
				className="flex-1"
				accessible={false}
			>
				<View
					className="flex-1 px-6 gap-5"
					style={{
						paddingTop: insets.top + 16,
						paddingBottom: insets.bottom + 24,
					}}
				>
					<QHeader
						categoryLabel="Encerramento"
						currentIndex={1}
						totalCount={1}
					/>

					<View className="gap-2">
						<Heading size="xl">
							Quer deixar algum comentário sobre a experiência?
						</Heading>
						<Text size="sm" className="text-muted-foreground">
							Opcional. Fale do que quiser: o que você adicionaria, removeria ou
							mudaria.
						</Text>
					</View>

					<Input className="h-40 flex-1 items-start px-3.5 py-3.5">
						<InputField
							placeholder="Escreva aqui, se quiser…"
							value={comment}
							onChangeText={text => setComment(text.slice(0, MAX_LENGTH))}
							multiline
							textAlignVertical="top"
							maxLength={MAX_LENGTH}
						/>
					</Input>
					<Text size="xs" className="text-right text-muted-foreground">
						{`${comment.length} / ${MAX_LENGTH}`}
					</Text>

					<Button disabled={isSubmitting} onPress={handleSubmit}>
						{isSubmitting ? <ButtonSpinner /> : null}
						<ButtonText>Enviar e finalizar</ButtonText>
					</Button>
				</View>
			</Pressable>
		</KeyboardAvoidingView>
	);
}
