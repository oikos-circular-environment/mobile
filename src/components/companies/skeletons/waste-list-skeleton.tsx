import { View } from "react-native";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function WasteItemSkeleton() {
	return (
		<View className="flex-row items-center justify-between gap-3">
			<View className="flex-1 gap-1">
				<Skeleton className="h-4 w-3/4 rounded-sm" />
				<Skeleton className="h-3 w-1/3 rounded-sm" />
			</View>
			<Skeleton className="h-6 w-6 rounded-sm" />
		</View>
	);
}

export function WasteListSkeleton() {
	return (
		<Card className="shadow-none gap-3">
			<Skeleton className="h-5 w-2/5 rounded-sm" />
			<WasteItemSkeleton />
			<WasteItemSkeleton />
			<WasteItemSkeleton />
		</Card>
	);
}
