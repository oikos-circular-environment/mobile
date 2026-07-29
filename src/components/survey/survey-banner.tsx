import { ChevronRightIcon, ClipboardListIcon } from "lucide-react-native";
import { View } from "react-native";
import { colors } from "@/components/style/colors";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { cn } from "@/libs/utils";

type SurveyBannerVariant = "invite" | "resume" | "pending-sync";

interface SurveyBannerProps {
	variant: SurveyBannerVariant;
	title: string;
	subtitle?: string;
	onPress: () => void;
	className?: string;
}

export function SurveyBanner({
	variant,
	title,
	subtitle,
	onPress,
	className,
}: SurveyBannerProps) {
	return (
		<Pressable
			onPress={onPress}
			className={cn(
				"flex-row items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2.5",
				className,
			)}
		>
			<View className="flex-1 flex-row items-center gap-2">
				<ClipboardListIcon size={16} color={colors.lime[800]} />

				<View className="flex-1">
					<Text size="sm" bold>
						{title}
					</Text>
					{subtitle ? (
						<Text size="xs" className="text-muted-foreground">
							{subtitle}
						</Text>
					) : null}
				</View>

				{variant === "pending-sync" ? (
					<View className="size-2 rounded-full bg-amber-500" />
				) : null}
			</View>

			<ChevronRightIcon size={16} color={colors.gray[400]} />
		</Pressable>
	);
}
