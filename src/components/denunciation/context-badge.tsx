import { ShieldAlertIcon } from "lucide-react-native";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";

export function DenunciationContextBadge() {
	return (
		<Badge
			variant="secondary"
			className="self-start gap-1 border border-transparent"
		>
			<BadgeIcon as={ShieldAlertIcon} />
			<BadgeText>DENÚNCIA</BadgeText>
		</Badge>
	);
}
