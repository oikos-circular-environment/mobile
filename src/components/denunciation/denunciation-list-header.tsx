import { PlusIcon, ShieldIcon } from "lucide-react-native";
import { View } from "react-native";
import { colors } from "@/components/style/colors";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";

export function DenunciationListHeader({
	onNewDenunciation,
}: {
	onNewDenunciation: () => void;
}) {
	return (
		<View className="gap-4">
			<Card className="bg-gray-100 p-4 shadow-none">
				<View className="flex-row items-center gap-4">
					<View className="flex-1 gap-1">
						<Heading>Denunciar</Heading>
						<Text className="text-sm text-gray-500" selectable>
							Faça a sua denúncia anônima. Ajude a manter a plataforma um lugar
							seguro e saudável.
						</Text>
					</View>

					<View className="size-14 items-center justify-center rounded-lg bg-lime-800">
						<ShieldIcon size={24} color={colors.white} strokeWidth={2.25} />
					</View>
				</View>
			</Card>

			<HStack className="gap-2">
				<Button className="flex-1" onPress={onNewDenunciation}>
					<ButtonIcon as={PlusIcon} className="text-white" />
					<ButtonText className="text-center font-semibold text-white">
						Nova Denúncia
					</ButtonText>
				</Button>
			</HStack>
		</View>
	);
}
