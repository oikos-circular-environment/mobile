import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import type { DenunciationSeverity } from "@/libs/types/denunciation";
import { denunciationSeverityOptions } from "@/libs/types/denunciation";
import { cn } from "@/libs/utils";

type SeverityColors = {
	containerClassName: string;
	contentClassName: string;
};

const SEVERITY_COLORS: Partial<
	Record<NonNullable<DenunciationSeverity>, SeverityColors>
> = {
	LOW: {
		containerClassName: "bg-lime-100",
		contentClassName: "text-lime-600",
	},
	MEDIUM: {
		containerClassName: "bg-yellow-100",
		contentClassName: "text-yellow-600",
	},
	HIGH: {
		containerClassName: "bg-orange-100",
		contentClassName: "text-orange-600",
	},
	CRITICAL: {
		containerClassName: "bg-red-100",
		contentClassName: "text-red-600",
	},
};

export function DenunciationSeverityBadge({
	severity,
}: {
	severity: DenunciationSeverity;
}) {
	const option = denunciationSeverityOptions.find(o => o.value === severity);
	const colors = severity ? SEVERITY_COLORS[severity] : undefined;
	if (!option || !colors) return null;
	return (
		<Badge
			variant="soft"
			className={cn("self-start gap-1", colors.containerClassName)}
		>
			{option.icon ? (
				<BadgeIcon as={option.icon} className={colors.contentClassName} />
			) : null}
			<BadgeText className={colors.contentClassName}>{option.label}</BadgeText>
		</Badge>
	);
}
