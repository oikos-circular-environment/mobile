import { Stack } from "expo-router";
import { Toaster } from "@/components/toast";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";

export default function SurveyStackLayout() {
	return (
		// A stack "survey" inteira é apresentada como `fullScreenModal` a partir da raiz
		// (src/app/_layout.tsx) — o <Toaster/> raiz vive numa View simples por trás dessa
		// modal e nunca aparece aqui dentro. Este provider próprio garante que os toasts
		// disparados nas telas do survey (ex.: "Código copiado!") renderizem dentro da
		// própria modal.
		<GluestackUIProvider mode="light">
			<Toaster />
			<Stack screenOptions={{ headerShown: false }}>
				<Stack.Screen name="index" />
				<Stack.Screen name="location-denied" />
				<Stack.Screen name="consent" />
				<Stack.Screen name="consent-ended" />
				<Stack.Screen name="persona" />
				<Stack.Screen name="characterization" />
				<Stack.Screen name="suite-intro" />
				<Stack.Screen name="questionnaire" />
				<Stack.Screen name="resume" />
				<Stack.Screen name="answers" />
				<Stack.Screen name="closing-comment" />
				<Stack.Screen name="thanks" />
			</Stack>
		</GluestackUIProvider>
	);
}
