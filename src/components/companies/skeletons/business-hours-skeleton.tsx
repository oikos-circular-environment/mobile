import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";

function DayRowSkeleton() {
	return (
		<View className="flex-row items-center gap-3 py-2">
			<Skeleton className="h-6 w-11 rounded-full" />
			<Skeleton className="h-5 flex-1 rounded-sm" />
			<Skeleton className="h-9 w-20 rounded-md" />
			<Skeleton className="h-9 w-20 rounded-md" />
		</View>
	);
}

export function BusinessHoursSkeleton() {
	return (
		<KeyboardAvoidingView
			className="flex-1"
			behavior={Platform.OS === "ios" ? "padding" : "height"}
		>
			<ScrollView
				className="flex-1 bg-white"
				contentContainerClassName="p-4 pb-8"
			>
				<View className="gap-4">
					<Skeleton className="h-7 w-2/3 rounded-sm" />

					<DayRowSkeleton />
					<DayRowSkeleton />
					<DayRowSkeleton />
					<DayRowSkeleton />
					<DayRowSkeleton />
					<DayRowSkeleton />
					<DayRowSkeleton />

					<View className="flex-row gap-2 pt-4">
						<Skeleton className="flex-1 h-10 rounded-md" />
					</View>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}
