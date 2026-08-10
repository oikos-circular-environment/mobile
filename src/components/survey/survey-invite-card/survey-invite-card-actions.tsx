import { View } from "react-native";
import { cn } from "@/libs/utils";

interface SurveyInviteCardActionsProps {
	children: React.ReactNode;
	className?: string;
}

export function SurveyInviteCardActions({
	children,
	className,
}: SurveyInviteCardActionsProps) {
	return <View className={cn("flex-row gap-2", className)}>{children}</View>;
}
