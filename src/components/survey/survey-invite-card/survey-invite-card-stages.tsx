import {
	CircleCheckIcon,
	CircleDashedIcon,
	CircleDotDashedIcon,
} from "lucide-react-native";
import { View } from "react-native";
import { colors } from "@/components/style/colors";
import { Text } from "@/components/ui/text";
import { cn } from "@/libs/utils";
import type { SurveyInviteStage } from "./types";

interface SurveyInviteCardStagesProps {
	items: SurveyInviteStage[];
	className?: string;
}

export function SurveyInviteCardStages({
	items,
	className,
}: SurveyInviteCardStagesProps) {
	if (items.length === 0) return null;

	return (
		<View
			className={cn(
				"w-full flex-row items-center gap-1 self-start rounded-full bg-white/[0.12] p-1",
				className,
			)}
		>
			{items.map(stage => {
				if (stage.status === "current") {
					return (
						<View
							key={stage.code}
							className="flex-row items-center gap-1.5 rounded-full bg-white px-3.5 py-2"
						>
							<CircleDotDashedIcon size={16} color={colors.lime[900]} />
							<Text size="xs" bold className="text-lime-900">
								{stage.currentLabel ?? stage.code}
							</Text>
						</View>
					);
				}

				const isDone = stage.status === "done" || stage.status === "completed";

				return (
					<View
						key={stage.code}
						className={cn(
							"size-9 items-center justify-center rounded-full",
							isDone && "bg-white/30",
						)}
					>
						{isDone ? (
							<CircleCheckIcon size={16} color="#ffffff" />
						) : (
							<CircleDashedIcon size={16} color={colors.yellow[400]} />
						)}
					</View>
				);
			})}
		</View>
	);
}
