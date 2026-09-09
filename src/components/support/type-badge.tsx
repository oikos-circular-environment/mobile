import type { LucideIcon } from "lucide-react-native";
import { BugIcon, HandHelpingIcon, SparklesIcon } from "lucide-react-native";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import type { SupportRequestType } from "@/libs/types/support";
import { cn } from "@/libs/utils";

type TypeConfig = {
	label: string;
	icon: LucideIcon;
	containerClassName: string;
	contentClassName: string;
};

const TYPE_CONFIG: Record<SupportRequestType, TypeConfig> = {
	ERROR: {
		label: "Erro",
		icon: BugIcon,
		containerClassName: "border-red-300 bg-red-50",
		contentClassName: "text-red-600",
	},
	SUPPORT: {
		label: "Ajuda",
		icon: HandHelpingIcon,
		containerClassName: "border-sky-300 bg-sky-50",
		contentClassName: "text-sky-600",
	},
	IMPROVEMENT: {
		label: "Melhoria",
		icon: SparklesIcon,
		containerClassName: "border-yellow-300 bg-yellow-50",
		contentClassName: "text-yellow-600",
	},
};

export function SupportTypeBadge({ type }: { type: SupportRequestType }) {
	const config = TYPE_CONFIG[type];
	return (
		<Badge
			variant="outline"
			className={cn("self-start gap-1", config.containerClassName)}
		>
			<BadgeIcon as={config.icon} className={config.contentClassName} />
			<BadgeText
				className={cn("text-[10px] font-semibold", config.contentClassName)}
			>
				{config.label}
			</BadgeText>
		</Badge>
	);
}
