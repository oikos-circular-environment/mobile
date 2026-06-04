import { AlertTriangleIcon, FactoryIcon } from "lucide-react-native";
import { Image, Pressable, View } from "react-native";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import type { Company } from "@/stores/companies-store";
import { Badge, BadgeIcon, BadgeText } from "../ui/badge";

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
							/>
						</View>
					) : (
						<View className="size-18 rounded-md bg-secondary items-center justify-center">
							<FactoryIcon size={22} className="text-muted-foreground" />
						</View>
					)}

					<View className="flex-1 justify-center">
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
							<Badge variant={company.status ? "default" : "destructive"}>
								<BadgeText>{company.status ? "Ativa" : "Inativa"}</BadgeText>
							</Badge>

							{!company.is_company_valid && (
								<Badge
									variant="outline"
									className="flex-row items-center gap-1 border-amber-100 bg-amber-100 px-2 py-0.5 rounded-md"
								>
									<BadgeIcon
										as={AlertTriangleIcon}
										className="text-amber-600"
									/>
									<BadgeText className="BadgeText-xs text-amber-600">
										Perfil incompleto
									</BadgeText>
								</Badge>
							)}
						</View>
					</View>
				</View>
			</Card>
		</Pressable>
	);
}
