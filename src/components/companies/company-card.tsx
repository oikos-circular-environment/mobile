import { Image } from "expo-image";
import { BuildingIcon } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { companyTypeOptions } from "@/libs/types/companies";
import type { getV1Companies } from "@/libs/oikos-sdk";

type Company = Awaited<
	ReturnType<typeof getV1Companies>
>["data"]["companies"][number];

function CompanyTypeBadge({ type }: { type: string }) {
	const label = companyTypeOptions.find(o => o.value === type)?.label ?? type;
	return (
		<View className="bg-primary/10 px-2 py-0.5 rounded-md self-start">
			<Text className="text-xs text-primary">{label}</Text>
		</View>
	);
}

interface CompanyCardProps {
	company: Company;
	onPress: () => void;
}

export function CompanyCard({ company, onPress }: CompanyCardProps) {
	return (
		<Pressable onPress={onPress}>
			<Card className="shadow-none">
				<View className="flex-row items-center gap-3">
					{company.avatar ? (
						<Image
							source={{ uri: company.avatar.url }}
							className="size-12 rounded-full"
							contentFit="cover"
						/>
					) : (
						<View className="size-12 rounded-full bg-secondary items-center justify-center">
							<BuildingIcon size={22} className="text-muted-foreground" />
						</View>
					)}

					<View className="flex-1 gap-1">
						<Text className="font-semibold text-base" numberOfLines={1}>
							{company.business_name ?? company.corporate_name}
						</Text>
						{company.business_name ? (
							<Text
								className="text-xs text-muted-foreground"
								numberOfLines={1}
							>
								{company.corporate_name}
							</Text>
						) : null}
						<CompanyTypeBadge type={company.company_type} />
					</View>
				</View>
			</Card>
		</Pressable>
	);
}

export function CompanyCardSkeleton() {
	return (
		<Card className="shadow-none">
			<View className="flex-row items-center gap-3">
				<Skeleton startColor="bg-gray-200" className="size-12 rounded-full" />
				<View className="flex-1 gap-2">
					<Skeleton startColor="bg-gray-200" className="h-4 w-3/4 rounded-md" />
					<Skeleton startColor="bg-gray-200" className="h-3 w-1/2 rounded-md" />
					<Skeleton startColor="bg-gray-200" className="h-5 w-20 rounded-md" />
				</View>
			</View>
		</Card>
	);
}
