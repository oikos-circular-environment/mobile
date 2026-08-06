import { View } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";

export function OptionRowSkeleton() {
	return (
		<View className="flex-row items-center gap-3 rounded-lg border border-border bg-white p-4">
			<Skeleton className="h-4 flex-1 rounded-sm" />
			<Skeleton className="h-5 w-5 rounded-full" />
		</View>
	);
}

export function OptionRowSkeletonList({ count = 8 }: { count?: number }) {
	return (
		<View className="gap-2.5">
			{Array.from({ length: count }).map((_, index) => (
				<OptionRowSkeleton key={index} />
			))}
		</View>
	);
}
