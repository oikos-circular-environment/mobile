import { Badge, BadgeText } from "@/components/ui/badge";

export function DenunciationContextBadge() {
	return (
		<Badge variant="secondary" className="self-start gap-1">
			<BadgeText className="text-[10px] font-semibold">DENÚNCIA</BadgeText>
		</Badge>
	);
}
