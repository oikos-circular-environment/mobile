import { StyleSheet } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/libs/utils";

type Props = {
	className?: string;
};

export function MapSkeleton({ className }: Props) {
	return (
		<Skeleton
			startColor="bg-gray-200"
			className={cn("rounded-none", className)}
			style={StyleSheet.absoluteFill}
		/>
	);
}
