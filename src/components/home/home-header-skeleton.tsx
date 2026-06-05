import { View } from "react-native";
import { Card } from "@/components/ui/card";
import { HStack } from "@/components/ui/hstack";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";

export function HomeHeaderSkeleton() {
	return (
		<Card className="flex flex-row gap-4 shadow-none items-center">
			<HStack space="xs" className="flex flex-1 items-center">
				<Skeleton variant="rounded" className="w-12 h-12 mr-2" />
				<View className="flex-1">
					<SkeletonText _lines={2} gap={1} className="h-4 w-full" />
				</View>
			</HStack>
		</Card>
	);
}
