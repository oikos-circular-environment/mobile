import { SproutIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

type AuthScreenLayoutProps = {
	title: string;
	subtitle: string;
	children: ReactNode;
	footer?: ReactNode;
};

export function AuthScreenLayout({
	title,
	subtitle,
	children,
	footer,
}: AuthScreenLayoutProps) {
	return (
		<ScrollView
			className="flex-1"
			contentInsetAdjustmentBehavior="automatic"
			contentContainerClassName="bg-white flex-1"
		>
			<View className="relative min-h-full flex-1  px-5 py-10">
				<Card className="z-10 w-full self-center max-w-md gap-6 rounded-2xl p-5 shadow-none">
					<View className="gap-6">
						<View className="flex-row items-center gap-3">
							<SproutIcon size={18} color="black" />
							<View className="h-px flex-1 bg-black" />
						</View>
						<View className="gap-1">
							<Heading className="text-2xl">{title}</Heading>
							<Text className="text-sm text-muted">{subtitle}</Text>
						</View>
					</View>

					{children}

					{footer && <View className="z-10 mt-5 items-center">{footer}</View>}
				</Card>
			</View>
		</ScrollView>
	);
}
