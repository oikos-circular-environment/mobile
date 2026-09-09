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
		containerClassName: "border-lime-600 bg-lime-50",
		contentClassName: "text-lime-600",
	},
	MEDIUM: {
		containerClassName: "border-yellow-300 bg-yellow-50",
		contentClassName: "text-yellow-600",
	},
	HIGH: {
		containerClassName: "border-orange-300 bg-orange-50",
		contentClassName: "text-orange-600",
	},
	CRITICAL: {
		containerClassName: "border-red-600 bg-red-600",
		contentClassName: "text-white",
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
			variant="outline"
			className={cn("self-start gap-1", colors.containerClassName)}
		>
			{option.icon ? (
				<BadgeIcon as={option.icon} className={colors.contentClassName} />
			) : null}
			<BadgeText className={colors.contentClassName}>{option.label}</BadgeText>
		</Badge>
	);
}
