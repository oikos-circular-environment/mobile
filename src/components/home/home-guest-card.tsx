import { Link } from "expo-router";
import { ArrowUpRight } from "lucide-react-native";
import { View } from "react-native";
import { colors } from "@/components/style/colors";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

export function HomeGuestCard() {
	return (
		<Link href="/sign-in">
			<Card className="flex flex-row justify-between shadow-none bg-secondary">
				<View className="flex-1">
					<Heading className="text-2xl">Bem-Vindos a Oikos!</Heading>
					<Text className="text-muted-foreground">
						Estamos felizes de você estar aqui conosco, colabore com o nosso
						ecosistema
					</Text>
				</View>
				<Card className="bg-primary items-center justify-center">
					<ArrowUpRight color={colors.white} />
				</Card>
			</Card>
		</Link>
	);
}
