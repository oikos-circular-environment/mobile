import { View } from "react-native";
import { Card } from "@/components/ui/card";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";

export function CompanyCardSkeleton() {
	return (
		<Card className="shadow-none gap-3">
			<View className="flex-row items-center gap-3">
				<Skeleton startColor="bg-gray-200" className="w-12 h-12 rounded-md" />
				<SkeletonText startColor="bg-gray-200" _lines={3} className="h-2" />
			</View>
			<View className="flex-row gap-3 pt-1 border-t border-gray-100 mt-1 items-center justify-center">
				<Skeleton startColor="bg-gray-200" className="h-3 w-16 rounded" />
				<Skeleton startColor="bg-gray-200" className="h-3 w-16 rounded" />
				<Skeleton startColor="bg-gray-200" className="h-3 w-16 rounded" />
			</View>
		</Card>
	);
}
