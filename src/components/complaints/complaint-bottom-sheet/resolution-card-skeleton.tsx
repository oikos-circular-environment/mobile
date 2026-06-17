import { View } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";

export function ResolutionCardSkeleton() {
	return (
		<View className="gap-2 rounded-[10px] border border-gray-100 p-3">
			<View className="flex-row items-center gap-2">
				<Skeleton startColor="bg-gray-200" className="h-8 w-8 rounded-full" />
				<View className="flex-1 gap-1.5">
					<Skeleton startColor="bg-gray-200" className="h-3.5 w-1/2 rounded" />
					<Skeleton startColor="bg-gray-200" className="h-3 w-1/3 rounded" />
				</View>
			</View>
			<Skeleton startColor="bg-gray-200" className="h-3 w-full rounded" />
			<Skeleton startColor="bg-gray-200" className="h-3 w-4/5 rounded" />
		</View>
	);
}
