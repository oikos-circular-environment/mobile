import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { View } from "react-native";

export function WasteSkeleton() {
	return (
		<View className="gap-4">
			{[1, 2, 3].map(i => (
				<Card key={i} className="shadow-none gap-3">
					<Skeleton className="h-6 w-1/2 rounded-md" />
					<Skeleton className="h-4 w-3/4 rounded-md" />
					<View className="flex-row gap-2">
						<Skeleton className="h-8 w-20 rounded-md" />
						<Skeleton className="h-8 w-20 rounded-md" />
					</View>
				</Card>
			))}
		</View>
	);
}
