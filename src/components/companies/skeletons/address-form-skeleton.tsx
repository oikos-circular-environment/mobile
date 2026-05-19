import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";
import { FieldSkeleton } from "./field-skeleton";

export function AddressFormSkeleton() {
	return (
		<KeyboardAvoidingView
			className="flex-1"
			behavior={Platform.OS === "ios" ? "padding" : "height"}
		>
			<ScrollView className="flex-1 bg-white p-4">
				<View className="flex gap-4 pb-8">
					<Skeleton className="h-7 w-1/2 rounded-sm" />

					<View className="gap-3">
						<FieldSkeleton />

						<View className="flex-row gap-2">
							<View className="flex-1">
								<FieldSkeleton />
							</View>
							<View className="w-20">
								<FieldSkeleton />
							</View>
						</View>

						<FieldSkeleton />
						<FieldSkeleton />
						<FieldSkeleton />

						<View className="flex-row gap-2">
							<View className="flex-1">
								<FieldSkeleton />
							</View>
							<View className="w-16">
								<FieldSkeleton />
							</View>
						</View>

						<View className="gap-2">
							<Skeleton className="h-4 w-1/4 rounded-sm" />
							<Skeleton className="h-48 w-full rounded-md" />
						</View>
					</View>

					<View className="flex-row gap-2 pt-4">
						<Skeleton className="flex-1 h-10 rounded-md" />
						<Skeleton className="flex-1 h-10 rounded-md" />
					</View>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}
