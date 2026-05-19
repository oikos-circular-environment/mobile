import { View } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";

export function FieldSkeleton({ inputClassName }: { inputClassName?: string }) {
	return (
		<View className="gap-2">
			<Skeleton className="h-4 w-1/3 rounded-sm" />
			<Skeleton className={`h-10 w-full rounded-md ${inputClassName ?? ""}`} />
		</View>
	);
}
