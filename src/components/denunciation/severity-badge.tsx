import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import type { DenunciationSeverity } from "@/libs/types/denunciation";
import { denunciationSeverityOptions } from "@/libs/types/denunciation";

export function DenunciationSeverityBadge({
	severity,
}: {
	severity: DenunciationSeverity;
}) {
	const option = denunciationSeverityOptions.find(o => o.value === severity);
	if (!option) return null;
	return (
		<Badge variant="secondary" className="self-start gap-1">
			{option.icon ? <BadgeIcon as={option.icon} /> : null}
			<BadgeText>{option.label}</BadgeText>
		</Badge>
	);
}

export function DenunciationContextBadge() {
	return (
		<Badge
			variant="outline"
			className="self-start gap-1 border-red-600 bg-red-50"
		>
			<BadgeText className="text-[10px] font-semibold text-red-700">
				DENÚNCIA
			</BadgeText>
		</Badge>
	);
}
