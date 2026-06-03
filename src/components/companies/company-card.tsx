import { Image } from "expo-image";
import { AlertTriangleIcon, FactoryIcon } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { colors } from "@/components/style/colors";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import type { Company } from "@/stores/companies-store";

interface CompanyCardProps {
	company: Company;
	onPress: () => void;
}

export function CompanyCard({ company, onPress }: CompanyCardProps) {
	return (
		<Pressable onPress={onPress}>
			<Card className="shadow-none gap-3">
				<View className="flex-row items-center gap-3">
					{company.avatar ? (
						<View className="border border-gray-200 rounded-lg items-center justify-center">
							<Image
								source={{ uri: company.avatar.url }}
								style={{ width: 64, height: 64, borderRadius: 8 }}
								contentFit="contain"
							/>
						</View>
					) : (
						<View className="size-18 rounded-md bg-secondary items-center justify-center">
							<FactoryIcon size={22} className="text-muted-foreground" />
						</View>
					)}

					<View className="flex-1 justify-center gap-1">
						<Heading size="xl" className="font-semibold" numberOfLines={1}>
							{company.business_name ?? company.corporate_name}
						</Heading>
						{company.business_name ? (
							<Text className="text-muted-foreground" numberOfLines={1}>
								{company.corporate_name}
							</Text>
						) : null}
						<Text className="text-muted-foreground" numberOfLines={1}>
							{company.identity}
						</Text>

						<View className="flex-row gap-2 mt-1 flex-wrap">
							<View
								className={
									company.status
										? "bg-primary/10 px-2 py-0.5 rounded-md"
										: "bg-gray-100 px-2 py-0.5 rounded-md"
								}
							>
								<Text
									className={`text-xs ${company.status ? "text-primary" : "text-gray-500"}`}
								>
									{company.status ? "Ativa" : "Inativa"}
								</Text>
							</View>

							{!company.is_company_valid && (
								<View className="flex-row items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md">
									<AlertTriangleIcon
										size={10}
										color={colors.amber[600]}
										strokeWidth={2}
									/>
									<Text className="text-xs text-amber-600">
										Perfil incompleto
									</Text>
								</View>
							)}
						</View>
					</View>
				</View>

			</Card>
		</Pressable>
	);
}
