import { HandIcon, RadiationIcon } from "lucide-react-native";
import { Fragment } from "react";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { Box } from "@/components/ui/box";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { WasteCategoryHazardLevel } from "./waste-category-hazard-level";

export function WasteCategoryCaption() {
	return (
		<Fragment>
			<Text size="sm" className="font-semibold text-muted-foreground">
				Legenda
			</Text>
			<Card className="shadow-none">
				<VStack space="md">
					<VStack space="md" className="items-start">
						<Badge
							variant="secondary"
							className="gap-1 bg-red-50 border border-red-200"
						>
							<BadgeIcon as={RadiationIcon} className="text-red-600 stroke-3" />
							<BadgeText className="text-red-600 font-semibold">RP</BadgeText>
						</Badge>
						<Box className="flex-1">
							<Text>Resíduo Perigoso.</Text>
						</Box>
					</VStack>
					<VStack space="md" className="items-start">
						<Badge
							variant="secondary"
							className="gap-1 bg-gray-50 border border-gray-200"
						>
							<BadgeIcon as={HandIcon} className="text-gray-600 stroke-3" />
							<BadgeText className="text-gray-600 font-semibold">RNP</BadgeText>
						</Badge>
						<Box className="flex-1">
							<Text>Resíduo Não Perigoso.</Text>
						</Box>
					</VStack>
					<VStack space="md" className="items-start">
						<WasteCategoryHazardLevel hazardLevel="LOW" />
						<Box className="flex-1">
							<Text>
								RNP confirmado, sem características de periculosidade, contato
								humano diário seguro.
							</Text>
						</Box>
					</VStack>
					<VStack space="md" className="items-start">
						<WasteCategoryHazardLevel hazardLevel="MEDIUM" />
						<Box className="flex-1">
							<Text>
								RNP potencial ou composição variável — pode conter componentes
								perigosos dependendo da origem.
							</Text>
						</Box>
					</VStack>
					<VStack space="md" className="items-start">
						<WasteCategoryHazardLevel hazardLevel="HIGH" />
						<Box className="flex-1">
							<Text>
								RP confirmado — exige manuseio com EPIs e coleta especializada.
							</Text>
						</Box>
					</VStack>
					<VStack space="md" className="items-start">
						<WasteCategoryHazardLevel hazardLevel="VERY_HIGH" />
						<Box className="flex-1">
							<Text>
								RP de alta virulência, explosão, contaminação irreversível —
								coleta convencional proibida.
							</Text>
						</Box>
					</VStack>
				</VStack>
			</Card>
		</Fragment>
	);
}
