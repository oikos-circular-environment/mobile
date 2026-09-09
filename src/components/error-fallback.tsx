import { TriangleAlert } from "lucide-react-native";
import { View } from "react-native";
import { colors } from "@/components/style/colors";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

type ErrorFallbackProps = {
	title?: string;
	message?: string;
	retryLabel?: string;
	onRetry: () => void;
};

export function ErrorFallback({
	title = "Algo deu errado",
	message = "Ocorreu um erro inesperado. Tente novamente.",
	retryLabel = "Tentar novamente",
	onRetry,
}: ErrorFallbackProps) {
	return (
		<View className="flex-1 items-center justify-center gap-4 bg-white p-6">
			<View className="size-16 items-center justify-center rounded-full bg-red-50">
				<TriangleAlert size={28} color={colors.red[500]} />
			</View>
			<Heading size="xl" className="text-center">
				{title}
			</Heading>
			<Text className="text-center text-muted-foreground">{message}</Text>
			<Button className="bg-lime-800 rounded-md" onPress={onRetry}>
				<ButtonText>{retryLabel}</ButtonText>
			</Button>
		</View>
	);
}
