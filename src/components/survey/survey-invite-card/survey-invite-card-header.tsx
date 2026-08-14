import { ClipboardListIcon } from "lucide-react-native";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { cn } from "@/libs/utils";

interface SurveyInviteCardHeaderProps {
	children?: React.ReactNode;
	className?: string;
}

export function SurveyInviteCardHeader({
	children,
	className,
}: SurveyInviteCardHeaderProps) {
	return (
		<View className={cn("flex-row items-center justify-between", className)}>
			<View className="flex-row items-center gap-1.5">
				<ClipboardListIcon size={13} color="#ffffffcc" />
				<Text size="xs" bold className="uppercase tracking-wider text-white/80">
					Modo pesquisa
				</Text>
			</View>

			{children}
		</View>
	);
}

interface SurveyInviteCardPersonaBadgeProps {
	children: React.ReactNode;
}

export function SurveyInviteCardPersonaBadge({
	children,
}: SurveyInviteCardPersonaBadgeProps) {
	return (
		<View className="rounded-full bg-white/15 px-2.5 py-1">
			<Text size="xs" bold className="text-white">
				{children}
			</Text>
		</View>
	);
}
