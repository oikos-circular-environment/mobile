"use client";

import { View } from "react-native";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ComplaintCardSkeleton() {
	return (
		<Card
			size="sm"
			className="gap-3 rounded-md border border-gray-100 bg-white p-3 shadow-none"
		>
			<View className="gap-2">
				<View className="flex-row items-center gap-2">
					<Skeleton startColor="bg-gray-200" className="w-16 h-16 rounded-md" />
					<Skeleton
						startColor="bg-gray-200"
						className="flex-1 h-16 rounded-md"
					/>
					<Skeleton startColor="bg-gray-200" className="w-4 h-16 rounded-md" />
				</View>
				<Skeleton startColor="bg-gray-200" className="h-32 w-full rounded" />
			</View>
		</Card>
	);
}
