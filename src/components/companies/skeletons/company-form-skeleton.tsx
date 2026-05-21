import { KeyboardAvoidingView, ScrollView, View } from "react-native";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FieldSkeleton } from "./field-skeleton";

export function CompanyFormSkeleton() {
	return (
		<KeyboardAvoidingView behavior="padding" className="flex-1">
			<ScrollView
				className="flex-1 bg-white"
				contentContainerClassName="p-4 pb-8"
			>
				<View className="gap-4">
					<Card className="shadow-none gap-3">
						<FieldSkeleton />
						<FieldSkeleton />
						<FieldSkeleton />
						<FieldSkeleton />
						<FieldSkeleton />
						<FieldSkeleton />
						<Skeleton className="h-10 w-full rounded-md mt-4" />
					</Card>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}
