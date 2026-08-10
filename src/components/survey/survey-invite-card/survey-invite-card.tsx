import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";
import { colors } from "@/components/style/colors";

interface SurveyInviteCardProps {
	children: React.ReactNode;
	className?: string;
}

export function SurveyInviteCard({
	children,
	className,
}: SurveyInviteCardProps) {
	return (
		<View className={className}>
			<LinearGradient
				colors={[colors.lime[700], colors.lime[900]]}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				style={{ borderRadius: 16, overflow: "hidden" }}
			>
				<View className="gap-3 p-5">{children}</View>
			</LinearGradient>
		</View>
	);
}
