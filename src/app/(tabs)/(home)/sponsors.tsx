import { ScrollView } from "react-native";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

export default function SponsorsScreen() {
	return (
		<ScrollView
			className="flex-1 bg-white"
			contentContainerClassName="p-4 pb-8"
		>
			<Card className="shadow-none gap-2">
				<Heading>Patrocinadores</Heading>
				<Text className="text-muted-foreground">
					Em breve você poderá conhecer planos de patrocínio e apoiar a
					plataforma.
				</Text>
			</Card>
		</ScrollView>
	);
}
