import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import type { SupportRequestType } from "@/libs/types/support";
import { supportTypeOptions } from "@/libs/types/support";

export function SupportTypeBadge({ type }: { type: SupportRequestType }) {
	const option = supportTypeOptions.find(o => o.value === type);
	if (!option) return null;
	return (
		<Badge variant="secondary" className="self-start gap-1">
			{option.icon ? <BadgeIcon as={option.icon} /> : null}
			<BadgeText>{option.label}</BadgeText>
		</Badge>
	);
}
