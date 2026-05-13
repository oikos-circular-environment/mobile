import {
	ShieldCheckIcon,
	ShieldIcon,
	ShieldQuestionMarkIcon,
	ShieldXIcon,
} from "lucide-react-native";
import { View } from "react-native";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

interface ComplaintPainelProps {
	panel: {
		total: number;
		resolved: number;
		pending: number;
		canceled: number;
	};
}

export function ComplaintPainel({ panel }: ComplaintPainelProps) {
	return (
		<View className="flex-1">
			<View className="flex-row flex-wrap gap-2">
				<Card className="w-[48%] items-start gap-2 border-gray-200 shadow-none">
					<View className="flex-row items-center">
						<View className="flex-1">
							<Heading>{panel.total}</Heading>
						</View>

						<View className="flex p-1 items-center justify-center rounded-md bg-sky-100">
							<ShieldIcon size={16} color="#0EA5E9" />
						</View>
					</View>

					<Text className="text-sm text-gray-500">Total de denúncias</Text>
				</Card>

				<Card className="w-[48%] items-start gap-2 border-gray-200 shadow-none">
					<View className="flex-row items-center">
						<View className="flex-1">
							<Heading>{panel.resolved}</Heading>
						</View>

						<View className="flex p-1 items-center justify-center rounded-md bg-lime-100">
							<ShieldCheckIcon size={16} color="#3F6212" />
						</View>
					</View>

					<Text className="text-sm text-gray-500">Denúncias resolvidas</Text>
				</Card>

				<Card className="w-[48%] items-start gap-2 border-gray-200 shadow-none">
					<View className="flex-row items-center">
						<View className="flex-1">
							<Heading>{panel.pending}</Heading>
						</View>

						<View className="flex p-1 items-center justify-center rounded-md bg-amber-100">
							<ShieldQuestionMarkIcon size={16} color="#FE9A00" />
						</View>
					</View>

					<Text className="text-sm text-gray-500">Denúncias pendentes</Text>
				</Card>

				<Card className="w-[48%] items-start gap-2 border-gray-200 shadow-none">
					<View className="flex-row items-center">
						<View className="flex-1">
							<Heading>{panel.canceled}</Heading>
						</View>

						<View className="flex p-1 items-center justify-center rounded-md bg-red-100">
							<ShieldXIcon size={16} color="#B91C1C" />
						</View>
					</View>

					<Text className="text-sm text-gray-500">Denúncias canceladas</Text>
				</Card>
			</View>
		</View>
	);
}
