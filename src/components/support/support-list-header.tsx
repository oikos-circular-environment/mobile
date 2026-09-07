import { LifeBuoyIcon, Plus } from "lucide-react-native";
import { View } from "react-native";
import { colors } from "@/components/style/colors";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";

export function SupportListHeader({
	onNewSupport,
}: {
	onNewSupport: () => void;
}) {
	return (
		<View className="gap-4">
			<Card className="bg-gray-100 p-4 shadow-none">
				<View className="flex-row items-center gap-4">
					<View className="flex-1 gap-1">
						<Heading>Suporte</Heading>
						<Text className="text-sm text-gray-500" selectable>
							Precisa de ajuda? Abra um chamado e nossa equipe vai te responder.
						</Text>
					</View>

					<View className="size-14 items-center justify-center rounded-lg bg-lime-800">
						<LifeBuoyIcon size={24} color={colors.white} strokeWidth={2.25} />
					</View>
				</View>
			</Card>

			<HStack className="gap-2">
				<Button className="flex-1" onPress={onNewSupport}>
					<ButtonIcon as={Plus} className="text-white" />
					<ButtonText className="text-center font-semibold text-white">
						Novo Chamado
					</ButtonText>
				</Button>
			</HStack>
		</View>
	);
}
