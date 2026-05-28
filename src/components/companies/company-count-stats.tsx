import { useQuery } from "@tanstack/react-query";
import { CalendarDaysIcon, PackageIcon, WrenchIcon } from "lucide-react-native";
import { View } from "react-native";
import { colors } from "@/components/style/colors";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import {
	getV1CompaniesByIdBusinessHours,
	getV1CompaniesByIdServices,
	getV1CompaniesByIdWastes,
} from "@/libs/oikos-sdk";

interface CompanyCountStatsProps {
	companyId: string;
}

export function CompanyCountStats({ companyId }: CompanyCountStatsProps) {
	const { data: wastesData, isLoading: isLoadingWastes } = useQuery({
		queryKey: ["company-wastes", companyId],
		queryFn: async () => {
			const res = await getV1CompaniesByIdWastes({ path: { id: companyId } });
			return res.data;
		},
	});

	const { data: servicesData, isLoading: isLoadingServices } = useQuery({
		queryKey: ["company-services", companyId],
		queryFn: async () => {
			const res = await getV1CompaniesByIdServices({ path: { id: companyId } });
			return res.data;
		},
	});

	const { data: hoursData, isLoading: isLoadingHours } = useQuery({
		queryKey: ["company-business-hours", companyId],
		queryFn: async () => {
			const res = await getV1CompaniesByIdBusinessHours({
				path: { id: companyId },
			});
			return res.data;
		},
	});

	const wasteCount = wastesData?.wastes.length ?? 0;
	const serviceCount = servicesData?.services.length ?? 0;
	const openDays = hoursData?.business_hours.filter(h => h.is_open).length ?? 0;
	const totalDays = hoursData?.business_hours.length ?? 7;

	return (
		<View className="flex-row justify-center gap-3 pt-1 border-t border-gray-100 mt-1">
			<View className="flex-row items-center gap-1.5">
				<PackageIcon size={12} color={colors.gray[500]} strokeWidth={2} />
				{isLoadingWastes ? (
					<Skeleton startColor="bg-gray-200" className="h-3 w-10 rounded" />
				) : (
					<Text className="text-xs text-gray-500">
						{wasteCount} resíduo{wasteCount !== 1 ? "s" : ""}
					</Text>
				)}
			</View>
			<View className="flex-row items-center gap-1.5">
				<WrenchIcon size={12} color={colors.gray[500]} strokeWidth={2} />
				{isLoadingServices ? (
					<Skeleton startColor="bg-gray-200" className="h-3 w-10 rounded" />
				) : (
					<Text className="text-xs text-gray-500">
						{serviceCount} serviço{serviceCount !== 1 ? "s" : ""}
					</Text>
				)}
			</View>
			<View className="flex-row items-center gap-1.5">
				<CalendarDaysIcon size={12} color={colors.gray[500]} strokeWidth={2} />
				{isLoadingHours ? (
					<Skeleton startColor="bg-gray-200" className="h-3 w-10 rounded" />
				) : (
					<Text className="text-xs text-gray-500">
						{openDays}/{totalDays} dias
					</Text>
				)}
			</View>
		</View>
	);
}
