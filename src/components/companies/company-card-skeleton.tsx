import { View } from "react-native";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function CompanyCardSkeleton() {
	return (
		<Card className="shadow-none gap-3">
			<View className="flex-row items-center gap-3">
				<Skeleton startColor="bg-gray-200" className="size-12 rounded-full" />
				<View className="flex-1 gap-2">
					<Skeleton startColor="bg-gray-200" className="h-4 w-3/4 rounded-md" />
					<Skeleton startColor="bg-gray-200" className="h-3 w-1/2 rounded-md" />
					<View className="flex-row gap-1.5">
						<Skeleton startColor="bg-gray-200" className="h-5 w-16 rounded-md" />
						<Skeleton startColor="bg-gray-200" className="h-5 w-12 rounded-md" />
					</View>
					<Skeleton startColor="bg-gray-200" className="h-3 w-20 rounded-md" />
				</View>
			</View>
			<View className="flex-row gap-3 pt-1 border-t border-gray-100 mt-1">
				<Skeleton startColor="bg-gray-200" className="h-3 w-16 rounded" />
				<Skeleton startColor="bg-gray-200" className="h-3 w-16 rounded" />
				<Skeleton startColor="bg-gray-200" className="h-3 w-16 rounded" />
			</View>
		</Card>
	);
}
