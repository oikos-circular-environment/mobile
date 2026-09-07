import { View } from "react-native";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";

export function SupportCardSkeleton() {
	return (
		<View className="gap-2 rounded-xl border border-gray-100 p-3">
			<Skeleton startColor="bg-gray-200" className="h-4 w-3/4 rounded" />
			<View className="flex-row items-center gap-2">
				<Skeleton startColor="bg-gray-200" className="h-5 w-20 rounded-full" />
				<Skeleton startColor="bg-gray-200" className="h-5 w-16 rounded-full" />
			</View>
			<Skeleton startColor="bg-gray-200" className="h-3 w-24 rounded" />
			<SkeletonText startColor="bg-gray-200" _lines={2} className="h-2" />
		</View>
	);
}
